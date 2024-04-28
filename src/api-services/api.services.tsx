import DeviceInfo from 'react-native-device-info';
import { fetch } from 'react-native-ssl-pinning';
import { urls, MONTH_NAME, decrypt, encrypt, checksum } from '../utilities/constants';
import { getRegistrationData, getLocalUserData, getCertsData } from '../utilities/helperFunctions';
import store from '../store';

import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

let isSslPinning = true;
const getService = (path: string, postHeaders: object = {}) => new Promise(async (resolve, reject) => {
    var userData = store.getState()['auth'].userData;
    var headers = {
        'Accept': 'text/plain',
        'Content-Type': 'text/plain',
        "Access-Control-Allow-Origin": "*",
        "e_platform": "mobile"
    }
    if(userData){
        headers['Authorization'] = 'Bearer '+userData.accessToken;
    }
    for(var key in postHeaders){
        headers[key] = postHeaders[key];
    }
    const requestOptions = {
        method: 'GET',
        redirect: 'follow',
        pkPinning: true,
        sslPinning: {
            certs: await getCertsData()
        },
        headers: headers,
    };

    let baseUrl = decrypt(urls.domain);
    var uri = `${baseUrl}${urls.api_prefix}${path}`;

    fetch(uri, requestOptions as any)
    .then(async response => {
        return response;
    })
    .then(async result => {
        var text = await result.text();
        if(isSslPinning ? result.headers['x-checksum'] : (result.headers as any).get('x-checksum') == checksum(text, true)){
            try{
                resolve(JSON.parse(decrypt(text)));
            }catch(e){
                throw({message: decrypt(text)});
            }
        }else{
            throw({message: 'Authentication failed'});
        }
    })
    .catch(error => {
        reject(error);
    });
});

const postService = (path: string, postData: object, postHeaders: object = {}) => new Promise(async (resolve, reject) =>  {
    var userData = store.getState()['auth'].userData;
    
    var headers = {
        'Accept': 'text/plain',
        'Content-Type': 'text/plain',
        "Access-Control-Allow-Origin": "*",
        "e_platform": "mobile",
        'X-Checksum': checksum(JSON.stringify(postData))
    }
    if(path == urls.login){
        var reg: any = await getRegistrationData();
        headers['clientId'] = reg['clientId'];
    }

    if(userData){
        headers['Authorization'] = 'Bearer '+userData.accessToken;
    }
    for(var key in postHeaders){
        headers[key] = postHeaders[key];
    }

    var bodyData = encrypt(JSON.stringify(postData));
    const requestOptions = {
        method: 'POST',
        body: bodyData,
        redirect: 'follow',
        pkPinning: true,
        sslPinning: {
            certs: await getCertsData()
        },
        headers: headers,
    };

    let baseUrl = decrypt(urls.domain);
    const uri = `${baseUrl}${urls.api_prefix}${path}`;

    fetch(uri, requestOptions as any)
    .then(async response => {
        return response;
    })
    .then(async result => {
        var text = await result.text();
        if(isSslPinning ? result.headers['x-checksum'] : (result.headers as any).get('x-checksum') == checksum(text, true)){
            try{
                resolve(JSON.parse(decrypt(text)));
            }catch(e){
                throw({message: decrypt(text)});
            }
        }else{
            throw({message: 'Authentication failed'});
        }
    })
    .catch(error => {
        reject(error);
    });
});

const postFormDataService = (path: string, postData: FormData) => new Promise(async (resolve, reject) =>  {
    
    var userData = store.getState()['auth'].userData;
    
    var headers = {
        'Accept': 'text/plain',
        'Authorization': 'Bearer '+userData.accessToken
    };
    if(!isSslPinning){
        headers['Content-Type'] = 'multipart/form-data';
    }

    let requestOptions = {
        method: 'POST',
        pkPinning: true,
        sslPinning: {
            certs: (await getCertsData()) as string[]
        },
        body: postData,
        headers: headers
    };

    let baseUrl = decrypt(urls.domain);
    const uri = `${baseUrl}${urls.api_prefix}${path}`;

    fetch(uri, requestOptions as any)
    .then(response => {
        return response;
    })
    .then(async result => {
        var text = await result.text();
        if(isSslPinning ? result.headers['x-checksum'] : (result.headers as any).get('x-checksum') == checksum(text, true)){
            try{
                resolve(JSON.parse(decrypt(text)));
            }catch(e){
                throw({message: decrypt(text)});
            }
        }else{
            throw({message: 'Authentication failed'});
        }
    })
    .catch(error => {
        reject(error);
    });
});

const SendErrorLog = async (methodName: any = null, error_mesage: string) => {

    var deviceId = await DeviceInfo.getUniqueId()

    let send_log = {
        "deviceId": deviceId,
        "methodName": methodName,
        "exceptionMessage": error_mesage,
        "logFilePath": ""
    }

    getLocalUserData().then((data: any) => {
        if(data){
            if(data.enableLog){
                insertLogs(methodName, error_mesage);
            }
        }
    })

    // const requestOptions = {
    //     method: 'POST',
    //     pkPinning: true,
    //     sslPinning: {
    //         certs: certs
    //     },
    //     headers: headers,
    //     body: JSON.stringify(send_log),
    //     redirect: 'follow'
    // };
    
    postService(urls.log_create, send_log);
    
    // const uri = `${decrypt(urls.domain)}${urls.api_prefix}${urls.log_create}`;

    // fetch(uri, requestOptions as any)
    // .then(response => response.json())
    // .then(result => {
        
    // })
    // .catch(error => {
        
    // });

}

const insertLogs = (methodName: string, error_mesage: string) => {
        
    const PATH = (Platform.OS == 'ios' ? RNFS.CachesDirectoryPath : RNFS.ExternalDirectoryPath)+'/Logs/';
    
    var dt = new Date();
    var date = dt.getUTCDate() > 9 ? dt.getUTCDate() : '0'+dt.getUTCDate();
    date += '-'+MONTH_NAME[dt.getUTCMonth()];
    date += '-'+dt.getUTCFullYear();

    var json_file_path = PATH+date+'.json';

    RNFS.exists(json_file_path)
    .then((exist) => {
        if(exist){
            readLogs(json_file_path, date, methodName, error_mesage);
        }else{
            RNFS.writeFile(json_file_path, '[]', 'utf8')
            .then((file) => {
                readLogs(json_file_path, date, methodName, error_mesage);
            })
        }
    })
}

const readLogs = (path: string, log_date: any, methodName: string, error_mesage: string) => {
    RNFS.readFile(path, 'utf8')
    .then((contents: any) => {
        contents = JSON.parse(contents);
        contents.push({
            "logDate": log_date,
            "methodName": methodName,
            "exceptionMessage": error_mesage
        })
        RNFS.writeFile(path, JSON.stringify(contents), 'utf8')
        .then((success) => {
            
        })
        .catch((err) => {
            
        });
    })
}

export {
    getService,
    postService,
    SendErrorLog,
    insertLogs,
    postFormDataService
}
