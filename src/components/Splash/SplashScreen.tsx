import React, { PureComponent } from 'react';
import { Text, View, StyleSheet, BackHandler, Platform, Dimensions, Alert } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Animatable from 'react-native-animatable';
import RNRestart from 'react-native-restart';
import RNExitApp from 'react-native-exit-app';

import DeviceInfo from 'react-native-device-info';
import messaging from '@react-native-firebase/messaging';
import NetInfo from "@react-native-community/netinfo";
import RNFetchBlob from 'rn-fetch-blob';
import RNFS from 'react-native-fs';

import Geolocation from 'react-native-geolocation-service';

import { colors, decrypt, urls, checksum, encrypt, setDomain} from '../../utilities/constants';
import { userData, colorLayout, allSiteType } from '../../store/actions';
import { 
    setLocalUserData, getRememberPassword, getWelcomeScreenData, getLocalUserData,
    setLogoData, getLogoData, getRegistrationData, setRegistrationData, setConnectivityModal,
    setCertsData, getCertsData, deleteUserDataFromLocal
} from '../../utilities/helperFunctions';
import { postService, getService, SendErrorLog } from '../../api-services';
import { SendErrorLogWitoutSsl } from '../../api-services';

import * as storage from '../../db';
import { Message } from '../common/Message';
import { AlertComponent } from '../common/Alert';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const color = {
    danger: '#CD3D3E',
    warning: '#EB9D3E',
    success: '#4DAD49',
    info: '#4CB3D5',
    default: '#565656'
}

class Splash extends PureComponent{

    state = {
        AppName: 'Inspecto',
        gpsCoordinate: '',
        deviceid: '',
        osVersion: '',
        device_token: '',
        image: require('../../../assets/img/factt-logo.png'),
        hasLogoData: false,
        message: '',
        backgroundColor: '',
        showAlert: false,
        headerTitle: '',
        type: "",
        showMessage: false,
        okText: ''
    }

    _netunsubscribe: any;
    _focus_unsubscribe: any;

    componentDidMount() {
        this.registerAppWithFCM();

        this.callInitials();
        this._focus_unsubscribe = this.props['navigation'].addListener('focus', () => {
            this.props['navigation'].addListener('blur', () => {
                if(this._focus_unsubscribe){
                    this._focus_unsubscribe();
                }
                if(this._netunsubscribe){
                    this._netunsubscribe();
                }
            });

            this.callInitials();
        });
        this.props['navigation'].addListener('blur', () => {
            if(this._focus_unsubscribe){
                this._focus_unsubscribe();
            }
            if(this._netunsubscribe){
                this._netunsubscribe();
            }
        });
    }

    async callInitials(){
        setConnectivityModal('');
        DeviceInfo.getUniqueId().then((id: any) => {
            this.setState({
                deviceid: id,
                osVersion: DeviceInfo.getSystemName()+' '+DeviceInfo.getSystemVersion()
            });
        })

        messaging()
        .getToken()
        .then(token => {
            this.setState({
                device_token: token
            })
        });
        getLogoData().then((data: any) => {
            if(data){
                this.setState({
                    image: {uri: data},
                    hasLogoData: true
                })
            }else{
                this.setState({
                    hasLogoData: false
                })
            }
        })
        getLocalUserData().then((data: any) => {
            if(data){
                // if(data['app_logo']){
                //     this.setState({
                //         image: {uri: data['app_logo']}
                //     })
                // }
                this.setState({
                    AppName: data.layoutName
                })
                
                this.props['actions'].userData({
                    data: data
                });
            }else{
                this.props['actions'].userData({
                    data: null
                });
            }

            // this.getLayoutData();
            // this.props['actions'].colorLayout({
            //     colors: colorLayout
            // });
        })
    }

    async registerAppWithFCM() {
        await messaging().registerDeviceForRemoteMessages();
    }

    componentWillUnmount(){
        
    }

    getLayoutData(){
        getService(urls.layout).then((data: any) => {
            if(data){
                if(data.responseCode == 5001 || data.responseCode == 5002){
                    SendErrorLog('Screen => SplashScreen > Method => getLayoutData @ api => '+urls.layout, 'Error While getting layout data');
                }
            }
            if(data.responseCode == 2000){
                data.responseData.layoutData.appDevBy = data.responseData.appDevBy ? data.responseData.appDevBy : 'Auhna Tech Lab';
                this.props['actions'].colorLayout({
                    colors: data.responseData.layoutData
                });
            }else{
                this.props['actions'].colorLayout({
                    colors: colorLayout
                });
            }
        }).catch((error: any) => {
            SendErrorLog('Screen => SplashScreen > Method => getLayoutData @ api => '+urls.layout, error.message);
            this.props['actions'].colorLayout({
                colors: colorLayout
            });
        })
    }

    accessLocation = async() => new Promise((resolve, reject) => {
        
        Geolocation.getCurrentPosition(info => {
            resolve(info);
        }, (err) => {
           
            this.setState({
                gpsCoordinate: null
            }, () => {
                this.props['navigation'].navigate('ScreenNavigator', {
                    params: {
                        colorLayout: this.props['colorLayout']
                    }
                });
            });
        },{
            enableHighAccuracy: true, 
            timeout: 2000000, 
            maximumAge: 100000
        });
    });

    checkConnectivity = (regcode: string) => {
        this.registerUser(regcode);
    };

    async getCertificates(checkRegData: boolean = true){

        var net = await NetInfo.fetch();
        if(net.isConnected && net.isInternetReachable){
          
            var regData: any = await getRegistrationData();
            
            let baseUrl = "";
            if(checkRegData){
                if(regData){
                    if(regData.clientId){
                        baseUrl = regData.clientId;
                        setDomain(encrypt(regData.clientId));
                    }else{
                        baseUrl = decrypt(urls.domain);
                    }
                }else{
                    baseUrl = decrypt(urls.domain);
                }
            }else{
                baseUrl = decrypt(urls.domain);
            }

            var uri = `${baseUrl}${urls.api_prefix}${urls.certs}`;

            var headers = {
                'Accept': 'text/plain',
                'Content-Type': 'text/plain'
            }
            const requestOptions = {
                method: 'GET',
                redirect: 'follow',
                headers: headers,
            };
            
            fetch(uri, requestOptions as any)
            .then(async response => {
                return response;
            })
            .then(async result => {
                var text = await result.text();
                if(result.headers.get('x-checksum') == checksum(text, true)){
                    try{ 
                        if((JSON.parse(decrypt(text))).responseCode == 2000){
                            setCertsData(JSON.parse(decrypt(text)).responseData);
                            setTimeout(() => {
                                this.handleAnimationEnd();
                            }, 1000);
                        }else{
                            SendErrorLogWitoutSsl('Screen => SplashScreen > Method => getCertificates @ api => '+uri, decrypt(text));
                            this.setState({
                                showMessage: true,
                                message: 'Unable to connect server',
                                headerTitle: 'Connection Failed',
                                okText: 'Ok'
                            });
                        }
                        
                    }catch(e){
                        SendErrorLogWitoutSsl('Screen => SplashScreen > Method => getCertificates @ api => '+uri, decrypt(text));
                        // throw({message: decrypt(text)});
                        this.setState({
                            showMessage: true,
                            message: 'Unable to connect server',
                            headerTitle: 'Connection Failed',
                            okText: 'Ok'
                        });
                    }
                }else{
                    SendErrorLogWitoutSsl('Screen => SplashScreen > Method => getCertificates @ api => '+uri, decrypt(text));
                    // throw({message: 'Authentication failed'});
                    this.setState({
                        showMessage: true,
                        message: 'Unable to connect server',
                        headerTitle: 'Connection Failed',
                        okText: 'Ok'
                    });
                }
            })
            .catch(error => {
                if(checkRegData){
                    deleteUserDataFromLocal();
                    setRegistrationData(null);
                    setDomain(urls.mainDomain);
                    setTimeout(() => {
                        this.getCertificates(false);
                    }, 10);
                }else{
                    this.isUserSessionExist();
                }
            });  
        }else{
            this.isUserSessionExist();
        }
    }

    handleAnimationEnd = async () => {
        
        var colorLayout = JSON.parse(JSON.stringify(colors));
        var net = await NetInfo.fetch();
        // this._netunsubscribe = NetInfo.addEventListener( net => {
            if(net.isConnected && net.isInternetReachable){
                getService(urls.layout).then((data: any) => {
                    if(data){
                        if(data.responseCode == 5001 || data.responseCode == 5002){
                            SendErrorLog('Screen => SplashScreen > Method => getLayoutData @ api => '+urls.layout, 'Error While getting layout data');
                        }
                    }
                    if(data.responseCode == 2000){
                        data.responseData.layoutData.appDevBy = data.responseData.appDevBy ? data.responseData.appDevBy : 'Auhna Tech Lab';
                        this.props['actions'].colorLayout({
                            colors: data.responseData.layoutData
                        });
                    }else{
                        this.props['actions'].colorLayout({
                            colors: colorLayout
                        });
                    }
                    this.isUserSessionExist();
                }).catch((error: any) => {
                    if(error.message == 'Network request failed' || error.status == 404){
                        this.setState({
                            showAlert: true,
                            backgroundColor: color.danger,
                            message: 'Unable to connect server',
                            headerTitle: 'Alert',
                            type: 'creds'
                        });
                    }else{
                        SendErrorLog('Screen => SplashScreen > Method => getLayoutData @ api => '+urls.layout, error.message);
                        this.props['actions'].colorLayout({
                            colors: colorLayout
                        });
                        this.isUserSessionExist();
                    }
                })
            }else{
                // this.props['actions'].colorLayout({
                //     colors: colorLayout
                // });
                this.isUserSessionExist();
            }
            
        // });
        // 
    };

    generateRefreshToken(userData, reg){
        var header = {
            grant_type: 'refresh_token'
        }
        
        getService(urls.refresh_token+'/'+Date.now(), header).then(async(res: any) => {
            if(res.responseCode == 2000){
                userData.accessToken = res.accessToken;
                userData.tokenExpiry = res.tokenExpiry;

                await setLocalUserData(userData);
                var user: any = await getLocalUserData();
                await this.isUserSessionExist();
            }else{
                var obj = {
                    responseData: reg
                };
                this.checkLoginType(obj, reg.regcode);
            }
        })
        .catch((error: any) => {
            var obj = {
                responseData: reg
            };
            this.checkLoginType(obj, reg.regcode);
            SendErrorLog('Screen => SplashScreen > Method => generateRefreshToken @ api => '+urls.refresh_token+' @ params => '+userData.accessToken, JSON.stringify(error));
        })
    }

    async isUserSessionExist(){
        var userData: any = await getLocalUserData();
        var r: any = await getRegistrationData();
        if(userData && r){
            var net = await NetInfo.fetch();
            var date = new Date(userData.tokenExpiry);
            var current = new Date();
            if(current.getTime() > date.getTime() && net.isConnected && net.isInternetReachable){
                this.generateRefreshToken(userData, r);
            }else{
                this.props['actions'].colorLayout({
                    colors: userData.layoutData
                });
                this.props['navigation'].navigate('ScreenNavigator', {
                    screen: 'DrawerNavigator',
                    params: {
                        colorLayout: userData.layoutData
                    }
                });
            }
            
        }else{
            getWelcomeScreenData().then(d => {
                if(d){
                    if(r){
                        this.accessLocation().then((info: any) => {
                            var lat = info.coords.latitude.toString();
                            var lng  = info.coords.longitude.toString();
                            this.setState({
                                gpsCoordinate: lat.split('.')[0]+'.'+lat.split('.')[1].substring(0,6)+','+lng.split('.')[0]+'.'+lng.split('.')[1].substring(0,6)
                            }, async () => {
                                var net = await NetInfo.fetch();
                                if(net.isConnected && net.isInternetReachable){
                                    this.checkConnectivity(r['regcode']);
                                }else{
                                    var colorLayout = JSON.parse(JSON.stringify(colors));
                                    this.props['actions'].colorLayout({
                                        colors: colorLayout
                                    });
                                    r.colorLayout = colorLayout;
                                    this.checkLoginType({responseData: r},r['regcode'])
                                }
                            });
                        }).catch(err => {
                            this.props['navigation'].navigate('ScreenNavigator', {
                                params: {
                                    colorLayout: this.props['colorLayout']
                                }
                            });
                        })
                    }else{
                        this.props['navigation'].navigate('AuthStackNavigator', {
                            screen: 'Registration',
                            params: {
                                colorLayout: this.props['colorLayout']
                            }
                        });
                    }
                }else{
                    this.props['navigation'].navigate('ScreenNavigator', {
                        params: {
                            colorLayout: this.props['colorLayout']
                        }
                    });
                }
            })
        }
    }



    checkUserData11(){
        getLocalUserData().then((data: any) => {
            if(data){
                getRememberPassword().then((saved_password: any) => {
                    getRegistrationData().then((r: any) => {
                        if(!r){
                            this.props['navigation'].navigate('AuthStackNavigator', {
                                screen: 'Registration',
                                params: {
                                    colorLayout: this.props['colorLayout']
                                }
                            });
                            return;
                        }
                        data.registration = r;
                        if(saved_password){
                            var v = saved_password.split('|');
                            data.login_id = v[1];
                            data.password = v[0];
                        }
                        this.accessLocation().then((info: any) => {
                            var lat = info.coords.latitude.toString();
                            var lng  = info.coords.longitude.toString();
                            this.setState({
                                gpsCoordinate: lat.split('.')[0]+'.'+lat.split('.')[1].substring(0,6)+','+lng.split('.')[0]+'.'+lng.split('.')[1].substring(0,6)
                            }, async () => {
                                var net = await NetInfo.fetch();
                                if(net.isConnected && net.isInternetReachable){
                                    this.registerUser(r['regcode'], saved_password ? data : null);
                                }else{
                                    if(saved_password){
                                        this.props['actions'].colorLayout({
                                            colors: data.layoutData
                                        });
                                        this.props['navigation'].navigate('ScreenNavigator', {
                                            screen: 'DrawerNavigator',
                                            params: {
                                                colorLayout: data.layoutData
                                            }
                                        });
                                    }else{
                                        this.registerUser(r['regcode'], saved_password ? data : null);
                                    }
                                }
                            });
                        }).catch(err => {
                            this.registerUser(r['regcode'], saved_password ? data : null);
                        })
                    })
                    
                })
                
            }else{
                getWelcomeScreenData().then(d => {
                    if(d){
                        getRegistrationData().then((r: any) => {
                            if(r){
                                this.accessLocation().then((info: any) => {
                                    var lat = info.coords.latitude.toString();
                                    var lng  = info.coords.longitude.toString();
                                    this.setState({
                                        gpsCoordinate: lat.split('.')[0]+'.'+lat.split('.')[1].substring(0,6)+','+lng.split('.')[0]+'.'+lng.split('.')[1].substring(0,6)
                                    }, async () => {
                                        var net = await NetInfo.fetch();
                                        if(net.isConnected && net.isInternetReachable){
                                            this.checkConnectivity(r['regcode']);
                                        }else{
                                            var colorLayout = JSON.parse(JSON.stringify(colors));
                                            this.props['actions'].colorLayout({
                                                colors: colorLayout
                                            });
                                            r.colorLayout = colorLayout;
                                            this.checkLoginType({responseData: r},r['regcode'])
                                        }
                                    });
                                }).catch(err => {
                                    this.props['navigation'].navigate('ScreenNavigator', {
                                        params: {
                                            colorLayout: this.props['colorLayout']
                                        }
                                    });
                                })
                            }else{
                                this.props['navigation'].navigate('AuthStackNavigator', {
                                    screen: 'Registration',
                                    params: {
                                        colorLayout: this.props['colorLayout']
                                    }
                                });
                            }
                        })
                    }else{
                        this.props['navigation'].navigate('ScreenNavigator', {
                            params: {
                                colorLayout: this.props['colorLayout']
                            }
                        });
                    }
                })
                
            }
        });
    }

    registerUser(registration_code, user_data: any = null){

        var postData = {
            regcode: registration_code,
            deviceid: this.state.deviceid,
            osVersion: this.state.osVersion,
            gpsCoordinate: this.state.gpsCoordinate,
            appVersion: DeviceInfo.getVersion()
        };

        postService(urls.register, postData).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => SplashScreen > Method => registerUser @ api => '+urls.register+' @ params => '+JSON.stringify(postData), 'Error While registering');
                }
            }
            if(res.responseCode == 2000){
                res.responseData.regcode = registration_code;
                setDomain(encrypt(res.responseData.clientId));
                setRegistrationData(res.responseData);
                if(user_data){
                    this.setAutoLogin(res.responseData, registration_code, user_data.login_id, user_data.password);
                }else{
                    this.checkLoginType(res, registration_code);
                }
            }else{
                this.props['navigation'].navigate('AuthStackNavigator', {
                    screen: 'Registration',
                    params: {
                        colorLayout: this.props['colorLayout']
                    }
                });
            }
        })
        .catch((error) => {
            SendErrorLog('Screen => SplashScreen > Method => registerUser @ api => '+urls.login+' @ params => '+JSON.stringify(postData), error.message);
            this.props['actions'].colorLayout({
                colors: colors
            });
            getRegistrationData().then((r: any) => {
                var obj = {
                    responseData: r
                };
                if(user_data){
                    this.setAutoLogin(obj.responseData, registration_code, user_data.login_id, user_data.password);
                }else{
                    this.checkLoginType(obj, registration_code);
                }
            })
        })

    }

    checkLoginType(res: any, registration_code: any){
        // setTimeout(function () {

            this.setState({
                showAlert: false
            }, () => {

                res.responseData.device_token = this.state.device_token;
                res.responseData.regcode = registration_code;

                setDomain(encrypt(res.responseData.clientId));
                setRegistrationData(res.responseData);

                if(res.responseData.authType == 'FACE' && res.responseData.faceRegistered){
                    this.props['navigation'].navigate('FaceLogin', {
                        props: res.responseData,
                    });
                }
                else if(res.responseData.authType == 'FACE' && !res.responseData.faceRegistered){
                    this.props['navigation'].navigate('FaceRegister', {
                        props: res.responseData,
                    });
                }
                else{
                    this.props['navigation'].navigate('Login', {
                        props: res.responseData,
                    });
                }
            });
        // }.bind(this), 1000);
    }

    setAutoLogin(response: any, registration_code: any, login_id: any, password: any){
        let headers = {
            secretKey: response.secretKey,
            udid: this.state.device_token
        };

        let postData = {
            loginId: login_id ? login_id.toLowerCase() : '',
            password: password,
            regcode: registration_code
        };
        
        postService(urls.login, postData, headers).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => SplashScreen > Method => setAutoLogin @ api => '+urls.login+' @ params => '+JSON.stringify(postData), 'Error While getting login');
                }
            }
            if(res.responseCode == 2000){
                this.getUserLayout(res, registration_code);
            }else{
                this.props['navigation'].navigate('AuthStackNavigator', {
                    screen: 'Registration',
                    params: {
                        colorLayout: this.props['colorLayout']
                    }
                });
            }
        })
        .catch((err) => {
            SendErrorLog('Screen => SplashScreen > Method => setAutoLogin @ api => '+urls.login+' @ params => '+JSON.stringify(postData), err.message);
        })
    }
    
    getUserLayout = (res: any, registration_code: any) => {
        const { colorLayout } = this.props as any;
        var user_data = {
            regcode: registration_code,
            deviceToken: this.state.device_token,
            accessToken: res.accessToken,
            tenantAPIUrl: res.tenantAPIUrl,
            userRole: res.userRole
        };
        this.props['actions'].userData({
            data: user_data
        });
        
        getService(urls.token_info).then((token_info: any) => {

            if(token_info){
                if(token_info.responseCode == 5001 || token_info.responseCode == 5002){
                    SendErrorLog('Screen => SplashScreen > Method => getUserLayout @ api => '+urls.token_info, 'Error While getting token info');
                }
            }
            if(token_info.responseCode == 2000){
                for(var key in token_info.responseData){
                    user_data[key] = token_info.responseData[key];
                }
                var path = `${decrypt(urls.domain)}images/tenantlogo/${user_data['tenantCode']}.png`;
                RNFetchBlob.fetch('GET',`${path}`)
                .then((data) => {
                    let status = data.info().status;
                    if(status == 200){
                        user_data['app_logo'] = 'data:image/png;base64,'+data.base64()
                    }
                    setLogoData('data:image/png;base64,'+data.base64());
                    this.props['actions'].userData({
                        data: user_data
                    });
                    getService(urls.layout).then((res: any) => {

                        if(res){
                            if(res.responseCode == 5001 || res.responseCode == 5002){
                                SendErrorLog('Screen => SplashScreen > Method => getLayoutData @ api => '+urls.layout, 'Error While getting layout data');
                            }
                        }
                        if(res.responseCode == 2000){
                            user_data['layoutData'] = res.responseData.layoutData;
                            user_data['layoutName'] = res.responseData.layoutName;
                        }
                        var colors = JSON.parse(JSON.stringify(colorLayout));
                        colors['headerBgColor'] = res.responseData.layoutData ? res.responseData.layoutData.headerBgColor : colorLayout.headerBgColor;
                        colors['headerTextColor'] = res.responseData.layoutData ? res.responseData.layoutData.headerTextColor : colorLayout.headerTextColor;
                        colors['appBgColor'] = res.responseData.layoutData ? res.responseData.layoutData.appBgColor : colorLayout.appBgColor;
                        colors['cardBgColor'] = res.responseData.layoutData ? res.responseData.layoutData.cardBgColor : colorLayout.cardBgColor;
                        colors['appTextColor'] = res.responseData.layoutData ? res.responseData.layoutData.appTextColor : colorLayout.appTextColor;
                        colors['subTextColor'] = res.responseData.layoutData ? res.responseData.layoutData.subTextColor : colorLayout.subTextColor;
                        colors['subHeaderBgColor'] = res.responseData.layoutData ? res.responseData.layoutData.subHeaderBgColor : colorLayout.subHeaderBgColor;
                        colors['systemHeaderBgColor'] = res.responseData.layoutData ? res.responseData.layoutData.systemHeaderBgColor : colorLayout.systemHeaderBgColor;
                        
                        colors['appDevBy'] = res.responseData.appDevBy ? res.responseData.appDevBy : 'Digicube';
                        setLocalUserData(user_data).then((res) => {
                            this.props['actions'].userData({
                                data: user_data
                            });
                            this.props['actions'].colorLayout({
                                colors: colors
                            });
                            this.GetAllData(colors);
                        })
                        .catch((err) => {
                            
                            this.registerUser(registration_code);
                        })
                    })
                    .catch((error) => {
                        SendErrorLog('Screen => SplashScreen > Method => getLayoutData @ api => '+urls.layout, error.message);
                        this.registerUser(registration_code);
                    })
                }).catch((err) => {
                    SendErrorLog('Screen => SplashScreen > Method => getLayoutData @ api => '+path, err.message);
                    this.registerUser(registration_code);
                });
            }else{
                getRegistrationData().then((r: any) => {

                    r.device_token = this.state.device_token;
                    r.regcode = registration_code;
                    this.props['navigation'].navigate('Login', {
                        props: r,
                    });
                    
                })
            }
            

        })
        .catch((error) => {
            SendErrorLog('Screen => SplashScreen > Method => getUserLayout @ api => '+urls.token_info, error.message);
            this.registerUser(registration_code);
        });

        
    }

    async GetAllData(colors: any){

        await getService(urls.master_all).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => SplashScreen > Method => GetAllData @ api => '+urls.master_all, 'Error While getting master data');
                }
            }
            if(res.responseCode == 2000){
                this.props['actions'].allSiteType(res.responseData.siteTypes);
                storage.insertSiteTypeData_TBL(res.responseData.siteTypes);

                storage.insertSiteData_TBL(res.responseData.sites);
                storage.insertQuestionCategoryData_TBL(res.responseData.qCategories);
                storage.insertReasonsData_TBL(res.responseData.reasons);
            }else{
                this.props['actions'].allSiteType([]);
                storage.insertSiteTypeData_TBL([]);

                storage.insertSiteData_TBL([]);
                storage.insertQuestionCategoryData_TBL([]);
                storage.insertReasonsData_TBL([]);
            }
        }).catch((error) => {
            console.log(error);
            SendErrorLog('Screen => SplashScreen > Method => GetAllData @ api => '+urls.master_all, error.message);
        })

        // need to be hit seprately
        await getService(urls.user_category).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => SplashScreen > Method => GetAllData @ api => '+urls.user_category, 'Error While getting user category');
                }
            }
            storage.insertUserCategoryData_TBL(res.responseCode == 2000 ? res.responseData : []);
        }).catch((error) => {
            SendErrorLog('Screen => SplashScreen > Method => GetAllData @ api => '+urls.user_category, error.message);
        });

        // need to be hit seprately
        await getService(urls.inspections).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => SplashScreen > Method => GetAllData @ api => '+urls.inspections, 'Error While getting inspections');
                }
            }
            storage.insertInspectionsData_TBL(res.responseCode == 2000 ? res.responseData : []);
        }).catch((error) => {
            SendErrorLog('Screen => SplashScreen > Method => GetAllData @ api => '+urls.inspections, error.message);
        });

        // need to be hit seprately
        await getService(urls.mobile_data).then((res: any) => {
            storage.insertAllMobileData_TBL(res.responseCode == 2000 ? res.responseData.inspections : []);
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => SplashScreen > Method => GetAllData @ api => '+urls.mobile_data, 'Error While getting mobile data');
                }
            }
            
            var role = this.props['userData']['userRoleCode'];
            this.props['navigation'].navigate('ScreenNavigator', {
                screen: 'DrawerNavigator',
                params: {
                    screen: 'StackNavigator',
                    params:{
                        screen: role == 'CHMNGR' ? 'VoucherList' : 'InspectionCategory',
                        colorLayout: this.props['colorLayout']
                    }
                }
            });
            
        }).catch((error) => {
            SendErrorLog('Screen => SplashScreen > Method => GetAllData @ api => '+urls.mobile_data, error.message);
        });

    }

    render() {

        return (
            // <SafeAreaView>
                <View style={{ ...styles_new.container, backgroundColor: '#ffffff' }} >

                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Animatable.Image 
                            delay={500} 
                            duration={1000} 
                            animation="zoomIn" 
                            iterationCount={1}
                            source={this.state.image} 
                            resizeMode='contain'
                            style={{height: 240, width: screenWidth * 0.8}}
                            useNativeDriver
                            onAnimationEnd={this.getCertificates.bind(this)}
                            onError={(e) => {
                                this.setState({
                                    image: require('../../../assets/img/factt-logo.png')
                                })
                            }}
                        />
                        

                        {
                            !this.state.hasLogoData &&
                            <Text
                                style={{
                                    marginTop: -50,
                                    textAlign: 'center',
                                    fontSize: 18,
                                    fontWeight: '500',
                                    height: 100,
                                    color: '#000',
                                    width: screenWidth - 40
                                }}
                            >
                                Fast Audit Compliance Tracking Tool
                            </Text>
                        }
                        
                        
                    </View>

                    <AlertComponent 
                        message={this.state.message} 
                        visible={this.state.showAlert}
                        onCancel={() => {
                            BackHandler.exitApp();
                        }}
                        onOk={async () => {
                            if(this.state.type == "offline"){
                                var user: any = await getLocalUserData();
                                var role = user['userRoleCode'];
                                this.props['navigation'].navigate('ScreenNavigator', {
                                    screen: 'DrawerNavigator',
                                    params: {
                                        screen: 'StackNavigator',
                                        params:{
                                            screen: role == 'CHMNGR' ? 'VoucherList' : 'InspectionCategory',
                                            colorLayout: this.props['colorLayout']
                                        }
                                    }
                                });
                            }else{
                                RNRestart.Restart();
                            }
                        }}
                        okText={this.state.type == "offline" ? "Yes" : "Try Again"}
                        cancelText={this.state.type == "offline" ? "No" : 'Exit'}
                        animation={'fade'}
                        headerTitle={'Connection Failed'}
                    ></AlertComponent>

                    <Message 
                        message={this.state.message} 
                        backgroundColor={'#fff'} 
                        visible={this.state.showMessage}
                        duration={5000}
                        onDismiss={() => {
                            this.setState({
                                showMessage: false
                            }, () => {
                                RNExitApp.exitApp();
                            });
                        }}
                        position={'bottom'}
                        headerTitle={this.state.headerTitle}
                        colorLayout={colorLayout}
                        OkText={this.state.okText}
                    ></Message>

                    

                    {/* </ImageBackground> */}

                </View>
            // </SafeAreaView>
        );
    }
}


const styles_new = StyleSheet.create({
    container: {
        flex: 1,
    },
    imageContainer: {
        flex: 1,
    },
    logoStyle: {
        justifyContent: 'center',
    },
    textContainer: {
        // position: 'absolute',
        // alignItems: 'center',
        // bottom: 100,
        alignItems: 'center',
        paddingTop: screenHeight * 0.5,
    },
    heading: {
        //fontFamily: Constant.Common.SFUID_REGULAR,
        fontSize: 30,
        fontWeight: 'bold',
        fontStyle: 'normal',
        letterSpacing: 0,
        textAlign: 'center',
        color: 'black'
    },
    subHeading: {
        //fontFamily: Constant.Common.ODUDA_BOLD,
        fontSize: 15,
        //fontWeight: "bold",
        fontStyle: 'normal',
        letterSpacing: 0,
        textAlign: 'center',
        color: 'black',
        marginTop: 10,
    },
});

const mapStateToProps = ({ auth }) => {
    return ({
        loader: auth.loading,
        userData: auth.userData,
        colorLayout: auth.colorLayout
    });
}

const ActionCreators = Object.assign(
    {},
    { userData },
    { colorLayout }, 
    { allSiteType }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Splash);
