import DeviceInfo from 'react-native-device-info';
import { urls, MONTH_NAME, decrypt, encrypt, checksum } from '../utilities/constants';
import { getRegistrationData, getLocalUserData, getCertsData } from '../utilities/helperFunctions';
import store from '../store';

import RNFS from 'react-native-fs';
import { Platform } from 'react-native';


const postServiceWitoutSsl = (path: string, postData: object, postHeaders: object = {}) => new Promise(async (resolve, reject) =>  {
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
        if((result.headers as any).get('x-checksum') == checksum(text, true)){
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


const SendErrorLogWitoutSsl = async (methodName: any = null, error_mesage: string) => {

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
    
    postServiceWitoutSsl(urls.log_create, send_log);

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
    postServiceWitoutSsl,
    SendErrorLogWitoutSsl,
}
