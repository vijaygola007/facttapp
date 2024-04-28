import React, { PureComponent } from 'react';
import { 
    StyleSheet,
    View,
    Text,
    Dimensions,
    TouchableOpacity,
    Image,
    LogBox, 
    Linking,
    ActivityIndicator,
    Keyboard, Platform,
} from 'react-native';
import { Icon } from 'react-native-elements';
import { getVersion } from 'react-native-device-info';
import {
    TextField,
} from 'rn-material-ui-textfield';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import RNFetchBlob from 'rn-fetch-blob';
import NetInfo from "@react-native-community/netinfo";
import DeviceInfo from 'react-native-device-info';

import Spinner from 'react-native-loading-spinner-overlay';
import messaging from '@react-native-firebase/messaging';
import crashlytics from '@react-native-firebase/crashlytics';

import { 
    setLocalUserData, setRememberPassword,
    setLogoData, getLogoData, setConnectivityModal, deleteUserDataFromLocal,
    getRegistrationData
} from '../../utilities/helperFunctions';
import { userData, allSiteType, colorLayout } from '../../store/actions';
import { Message, AlertComponent } from '../../components/common';
import { getService, postService, SendErrorLog } from '../../api-services';
import { urls, hexToRgbA, ALERT_MESSAGES, decrypt, encrypt } from '../../utilities/constants';

import * as storage from '../../db';

// wrappers
import { Wrapper, ContentWrapper, TEXT_SIZE_10, TEXT_SIZE_14, TEXT_SIZE_16, 
    TEXT_SIZE_22, BTN_BORDER_RADIUS, SCREEN_WIDTH, APP_PADDING, ContentWrapper2, PADDING_14 } from '../../layout/wrapper';

const color = {
    danger: '#CD3D3E',
    warning: '#EB9D3E',
    success: '#4DAD49',
    info: '#4CB3D5',
    default: '#565656'
}

class Registration extends PureComponent {

    _unsubscribe: any;
    _netunsubscribe: any;
    _focus_unsubscribe: any;
    // cl = this.props['colorLayout'];

    constructor(props){
        super(props);
    }

    state = {
        login_id: '',
        password: '',
        response: this.props['route'],
        showMessage: false,
        message: '',
        backgroundColor: '',
        captureImage: false,
        spinner: false,
        remember_password: true,
        secure_password: true,
        orientationChanged: false,
        showKeyboard: false,
        image: require('../../../assets/img/factt-logo.png'),
        colorLayout: JSON.parse(JSON.stringify(this.props['colorLayout'])),
        canChangeLayout: false,
        is_login_id_focused: false,
        is_password_focused: false,

        moving_first_dot: true,
        moving_first_dot_ends: false,

        moving_second_dot: false,
        moving_second_dot_ends: false,
        
        moving_third_dot: false,
        moving_third_dot_ends: false,

        current_running: 'first',
        alertHerderTitle: '',
        okText: '',
        cancelText: '',
        showAlert: false,
        headerTitle: 'Alert',
        type: 'creds',
        OkText: 'Ok',
        device_token: ''
    };
    
    componentDidMount() {
        // console.ig = []
        // LogBox.ignoreLogs(['Animated: useNativeDriver']);
        this.callInitials();
        this._focus_unsubscribe = this.props['navigation'].addListener('focus', () => {
            // this.props['navigation'].addListener('blur', () => {
            //     this._focus_unsubscribe();
            //     if(this._netunsubscribe){
            //         this._netunsubscribe();
            //     }
            //     if(this._unsubscribe){
            //         this._unsubscribe();
            //     }
            // });
            this.callInitials();
        });

        this.props['navigation'].addListener('blur', () => {

            this.setState({
                login_id: '',
                password: '',
                remember_password: false
            });

            // this._focus_unsubscribe();
            // if(this._netunsubscribe){
            //     this._netunsubscribe();
            // }
            // if(this._unsubscribe){
            //     this._unsubscribe();
            // }
        });
        
    }

    checkAppVersion(data: any){
        var currentVersion = parseInt(getVersion().split('.').join(''));
        var availableVersion = parseInt(data.mAppVer.split('.').join(''));
        var isVersionHigher = availableVersion > currentVersion;

        return isVersionHigher;
    }

    async callInitials(){
        storage.DELETE_TABLE_DATA().then(() => {

        }).catch(() => {

        });
        storage.runQuery(`delete from ${storage.draft_tbl}`);
        deleteUserDataFromLocal();
        this.setState({
            login_id: '',
            password: '',
            remember_password: false
        });

        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);

        if(Platform.OS == 'ios'){
            // await messaging().registerDeviceForRemoteMessages()
        }

        messaging()
        .getToken()
        .then(token => {
            this.setState({
                device_token: token
            });
        });
        if(this['props']['route']['params']){
            this.setState({
                response: this['props']['route']['params']['props'] ? this['props']['route']['params']['props'] : this['props']['route']['params']
            }, () => {
                
            })
        }

        // this.cl = this.props['colorLayout'];
        this.setState({
            canChangeLayout: false
        })
        setTimeout(() => {
            this.setState({
                canChangeLayout: true
            })
        }, 500);
        

        if(this['props']['route']['params']){
            this.setState({
                response: this['props']['route']['params']['props'] ? this['props']['route']['params']['props'] : this['props']['route']['params']
            })
        }
        this._unsubscribe = this.props['navigation'].addListener('beforeRemove', (e: any) => {
            if(e.data.action.type == 'GO_BACK'){
                e.preventDefault();
            }
            return;
        });
        getLogoData().then((data: any) => {
            if(data){
                this.setState({
                    image: {uri: data}
                })
            }
        })

        setTimeout(() => {
            this.setState({
                canChangeLayout: true
            })
        }, 500);
    }

    componentWillUnmount(){
        // if(this._unsubscribe){
        //     this._unsubscribe();
            
        // }
    }

    async onSignIn(error_log: any) {
        crashlytics().log('Login screen crash analytics');
        await Promise.all([
          crashlytics().setUserId(error_log.uid),
          crashlytics().setAttributes({
            ...error_log
          }),
        ]);
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.onSignIn({
            screen: 'Login',
            error: error.message,
        });
        crashlytics().crash();
    }
    
    checkConnectivity = async () => {

        var net = await NetInfo.fetch();
        // this._netunsubscribe = NetInfo.addEventListener(net => {
            if(net.isConnected && net.isInternetReachable){
                
                this.loginUser();
                
            }else{
                this.setState({
                    showMessage: true,
                    backgroundColor: color.danger,
                    message: 'Internet connection is not available',
                    headerTitle: 'Alert',
                    type: 'creds'
                });
            }
        // });
    };

    loginUser = () => {
        if(!this.state.login_id && !this.state.password){
            this.setState({
                showMessage: true,
                backgroundColor: color.danger,
                message: 'Login id / password is incorrect',
                headerTitle: 'Alert',
                type: 'creds'
            });
            return;
        }
        if(this.checkAppVersion(this.state.response)){
            this.setState({
                showMessage: true,
                backgroundColor: color.danger,
                message: 'New application version ('+this.state.response.mAppVer+') is available on server',
                headerTitle: 'Update App',
                type: 'update'
            });
            return;
        }
        this.setState({
            spinner: true
        });

        let headers = {
            secretKey: this.state.response.secretKey,
            udid: this.state.device_token
        };

        let postData = {
            loginId: this.state.login_id.toLowerCase(),
            password: this.state.password,
            regcode: this.state.response.regcode
        };

        postService(urls.login, postData, headers).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => LoginScreen > Method => loginUser @ api => '+urls.login+' @ params => '+JSON.stringify(postData), 'Error While getting login');
                }
            }
            if(res.responseCode == 2000){
                this.getUserLayout(res);
            }else{

                this.setState({
                    spinner: false
                });
                
                if(res.responseCode == 1010 || res.responseCode == 1021){
                    this.setState({
                        showMessage: true,
                        backgroundColor: color.danger,
                        message: res.responseCode == 1010 ? 'Registration code already used' : 'User logged on another device',
                        headerTitle: 'Alert',
                        type: 'already_used'
                    });
                }
                else if(res.responseCode == 1011){
                    this.setState({
                        showMessage: true,
                        backgroundColor: color.danger,
                        message: 'Your application licence has been expired, Please contact administrator',
                        headerTitle: 'Alert',
                        type: 'already_used'
                    });
                }
                else{
                    
                    this.setState({
                        showMessage: true,
                        backgroundColor: color.danger,
                        message: res.responseMessage.split('_').join(' '),
                        headerTitle: 'Alert',
                        type: 'creds',
                    });
                }
            }
        })
        .catch((error) => {
            if(error.status != 200){
                this.setState({
                    showMessage: true,
                    loading: false,
                    backgroundColor: color.danger,
                    message: ALERT_MESSAGES.server_not_connected,
                    spinner: false
                });
            }
            SendErrorLog('Screen => LoginScreen > Method => loginUser @ api => '+urls.login+' @ params => '+JSON.stringify(postData), error.message);
        })
    }

    getUserLayout = (res: any) => {
        const { colorLayout } = this.props as any;
        var user_data = {
            regcode: this.state.response.regcode,
            deviceToken: this.state.response.device_token,
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
                    SendErrorLog('Screen => LoginScreen > Method => getUserLayout @ api => '+urls.token_info, 'Error While getting token info');
                }
            }
            if(token_info.responseCode == 2000){
                for(var key in token_info.responseData){
                    user_data[key] = token_info.responseData[key];
                }
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
                            SendErrorLog('Screen => LoginScreen > Method => getLayoutData @ api => '+urls.layout, 'Error While getting layout data');
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
        
                    colors['appDevBy'] = res.responseData.appDevBy ? res.responseData.appDevBy : '';
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
                        this.setState({
                            showMessage: true,
                            spinner: false,
                            backgroundColor: color.danger,
                            message: 'UNABLE TO LOGIN',
                        });
                    })
                })
                .catch((error) => {
                    SendErrorLog('Screen => LoginScreen > Method => getLayoutData @ api => '+urls.layout, error.message);
                    this.setState({
                        showMessage: true,
                        spinner: false,
                        backgroundColor: color.danger,
                        message: 'UNABLE TO LOGIN',
                    });
                })
            }).catch((err) => {
                SendErrorLog('Screen => LoginScreen > Method => getLayoutData @ api => '+path, err.message);
                this.setState({
                    spinner: false
                });
            });

        })
        .catch((error) => {
            SendErrorLog('Screen => LoginScreen > Method => getUserLayout @ api => '+urls.token_info, error.message);
            this.setState({
                spinner: false
            });
        });

        
    }

    async GetAllData(colors: any){
        await getService(urls.master_all).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => LoginScreen > Method => GetAllData @ api => '+urls.master_all, 'Error While getting master data');
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
            SendErrorLog('Screen => LoginScreen > Method => GetAllData @ api => '+urls.master_all, error.message);
        })

        // need to be hit seprately
        await getService(urls.user_category).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => LoginScreen > Method => GetAllData @ api => '+urls.user_category, 'Error While getting user category');
                }
            }
            storage.insertUserCategoryData_TBL(res.responseCode == 2000 ? res.responseData : []);
        }).catch((error) => {

            SendErrorLog('Screen => LoginScreen > Method => GetAllData @ api => '+urls.user_category, error.message);
        });

        // need to be hit seprately
        await getService(urls.inspections).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => LoginScreen > Method => GetAllData @ api => '+urls.inspections, 'Error While getting inspections');
                }
            }
            storage.insertInspectionsData_TBL(res.responseCode == 2000 ? res.responseData : []);
        }).catch((error) => {
            SendErrorLog('Screen => LoginScreen > Method => GetAllData @ api => '+urls.inspections, error.message);
        });

        // need to be hit seprately
        await getService(urls.mobile_data).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => LoginScreen > Method => GetAllData @ api => '+urls.mobile_data, 'Error While getting mobile data');
                }
            }
            storage.insertAllMobileData_TBL(res.responseCode == 2000 ? res.responseData.inspections : []);
            this.setState({
                spinner: false
            }, () => {
                this.saveLoginPassword(this.state.password+'|'+this.state.login_id);
                // if(this.state.remember_password){
                //     this.setState({
                //         message: 'Save credentials for future login ?',
                //         showAlert: true,
                //         showMessage: false,
                //         alertHerderTitle: 'Remember Password',
                //         okText: 'Yes',
                //         cancelText: 'No'
                //     })
                // }else{
                //     this.saveLoginPassword('');
                // }
                
            })
        }).catch((error) => {
            SendErrorLog('Screen => LoginScreen > Method => GetAllData @ api => '+urls.mobile_data, error.message);
        });

    }

    saveLoginPassword = (creds: string) => {
        setConnectivityModal('');
        // setRememberPassword(creds);
        this.props['navigation'].navigate('ScreenNavigator', {
            screen: 'DrawerNavigator',
            params: {
                screen: 'StackNavigator',
                params:{
                    screen: this.props['userData']['userRoleCode'] == 'CHMNGR' ? 'VoucherList' : 'InspectionCategory',
                    colorLayout: this.props['colorLayout']
                }
            }
        });
        // InspectionCategory
    }

    render() {
        
        const { colorLayout }: any = this.props;
        
        return ( 
            <Wrapper
     
                colorLayout={colorLayout}
                disableKeyboardBottom={true}
                scrollEnabled={true}
                containerStyle={{
                    paddingTop: 0,
                }} 
            >
                {/* <ContentWrapper
                    style={{
                        paddingHorizontal: 0,
                    }}
                    colorLayout={colorLayout}
                > */}
                <View
                    style={{
                        flex: 1,
                        backgroundColor: '#fff',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        // width: SCREEN_WIDTH
                    }}
                >
                    <Image
                        style={{ width: 300, height: '20%', alignSelf: 'center'}}
                        source={require('../../../assets/img/factt-logo.png')} 
                        resizeMode={'contain'}
                    />
                    
                    <Image
                        style={{ height: 260, alignSelf: 'center', }}
                        source={require('../../../assets/img/demo.jpg')} 
                        resizeMode={'contain'}
                    />
                    
                    <View
                        style={{
                            
                        }}
                    >
                        <Text
                            style={{
                                marginTop: 0,
                                fontSize: TEXT_SIZE_22,
                                fontWeight: '600',
                                color: colorLayout.subTextColor
                            }}
                        >
                            Sign in
                        </Text>

                        <Text
                            style={{
                                fontSize: TEXT_SIZE_16,
                                color: colorLayout.subTextColor,
                                marginVertical: 10,
                                opacity: 0.7
                            }}
                        >
                            Sign in to your account
                        </Text>
                    </View>

                    <View
                        style={{
                            
                        }}
                    >
                        <TextField
                            label="Login ID"
                            lineWidth={this.state.is_login_id_focused ? 2 : this.state.login_id ? 2 : 1}
                            value={this.state.login_id}
                            onChangeText={(text: string) => {
                                this.setState({ login_id: text.slice(0, 25).trim() });
                            }}
                            baseColor={
                                this.state.is_login_id_focused 
                                ? 
                                colorLayout.subHeaderBgColor : this.state.login_id ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                            }
                            tintColor={
                                this.state.is_login_id_focused 
                                ? 
                                colorLayout.subHeaderBgColor : this.state.login_id ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                            }
                            characterRestriction={25}
                            titleTextStyle={{
                                display: 'none'
                            }} 
                            onFocus={() => {
                                this.setState({
                                    is_login_id_focused: true
                                })
                            }} 
                            onBlur={() => {
                                this.setState({
                                    is_login_id_focused: false
                                })
                            }}  
                            fontSize={this.state.is_login_id_focused ? 18 : 16}
                            contentInset={{
                                top: this.state.is_login_id_focused ? 0 : 10,
                                input: 2,
                                label: 8
                            }}
                        />
                        <View
                            style={{
                                display: 'flex',
                                flexDirection: 'row'
                            }}
                        >
                            <TextField
                                label="Password"
                                lineWidth={this.state.is_password_focused ? 2 : this.state.password ? 2 : 1}
                                value={this.state.password}
                                onChangeText={(text: string) => {
                                    this.setState({ password: text.slice(0, 15).trim() });
                                }}
                                baseColor={
                                    this.state.is_password_focused 
                                    ? 
                                    colorLayout.subHeaderBgColor : this.state.password ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                                }
                                tintColor={
                                    this.state.is_password_focused 
                                    ? 
                                    colorLayout.subHeaderBgColor : this.state.password ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                                }
                                characterRestriction={15}
                                style={{
                                    
                                }}
                                inputRef={(ref) => {
                                    if(ref){
                                        
                                    }
                                }}  
                                titleTextStyle={{
                                    display: 'none'
                                }}  
                                inputContainerStyle={{
                                    // fontSize: 36,
                                    width: SCREEN_WIDTH - (2 * APP_PADDING)
                                }} 
                                onFocus={() => {
                                    this.setState({
                                        is_password_focused: true
                                    })
                                }} 
                                onBlur={() => {
                                    this.setState({
                                        is_password_focused: false
                                    })
                                }}  
                                secureTextEntry={this.state.secure_password}
                                fontSize={this.state.is_password_focused ? 18 : 16}
                                contentInset={{
                                    // top: this.state.is_password_focused ? 0 : 10,
                                    input: 2,
                                    label: 8
                                }}
                            />
                            
                            <TouchableOpacity
                                style={{
                                    borderRadius: 6,
                                    marginLeft: -50,
                                    // position: 'absolute',
                                    width: 45,
                                    // marginTop: 5,
                                    backgroundColor: 'transparent',
                                    marginBottom: 15,
                                    flexDirection: 'column',
                                    justifyContent: 'flex-end',
                                    alignItems: 'center'
                                }}
                                onPress={() => {
                                    
                                }}
                            >
                                <Icon
                                    name={this.state.secure_password ? 'eye-slash' : 'eye'}
                                    type='font-awesome'
                                    color={this.state.secure_password ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.7)'}
                                    size={22}
                                    containerStyle={{
                                        // flex: 1,
                                        // justifyContent: 'flex-end',
                                        // marginBottom: -2
                                    }}
                                    
                                    onPress={() => {
                                        this.setState({
                                            secure_password : !this.state.secure_password
                                        })
                                    }}
                                />
                            </TouchableOpacity>
                        </View>
                        <View
                            style={{
                                marginTop: 10,
                                marginBottom: 5
                            }}
                        >

                            <TouchableOpacity
                                style={{
                                    backgroundColor: colorLayout['subHeaderBgColor'],
                                    borderRadius: BTN_BORDER_RADIUS,
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: Platform.OS == 'ios' && DeviceInfo.hasNotch() ? 10 : 0,
                                    paddingVertical: PADDING_14,
                                    opacity: this.state.password.length > 3 && this.state.password.length > 3 ? 1 : 0.8
                                }}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    this.checkConnectivity();
                                }}
                                disabled={this.state.password.length > 3 && this.state.password.length > 3 ? false : true}
                            >
                                <Text
                                    style={{
                                        color: colorLayout['headerTextColor'],
                                        fontSize: 18,
                                        textAlignVertical: 'center'
                                    }}
                                >
                                    Continue
                                </Text>
                            </TouchableOpacity>

                            

                        </View>
                        <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'flex-end',
                                    paddingBottom: APP_PADDING
                                }}
                            >
                                {/* <View
                                    style={{
                                        flexDirection: 'row',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: TEXT_SIZE_10,
                                            color: colorLayout.subTextColor,
                                            display: colorLayout.appDevBy ? 'flex' : 'none'
                                        }}
                                        numberOfLines={1}
                                        ellipsizeMode={'clip'}
                                    >
                                        Powered By:&nbsp;
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: TEXT_SIZE_10,
                                            color: colorLayout.subTextColor,
                                            display: colorLayout.appDevBy ? 'flex' : 'none'
                                        }}
                                        numberOfLines={1}
                                        ellipsizeMode={'clip'}
                                    >
                                        {colorLayout.appDevBy}
                                    </Text>
                                </View> */}
                                <View
                                    style={{
                                        flexDirection: 'row'
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: TEXT_SIZE_10,
                                            color: colorLayout.subTextColor,
                                        }}
                                        numberOfLines={1}
                                        ellipsizeMode={'clip'}
                                    >
                                        Version:&nbsp;
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: TEXT_SIZE_10,
                                            color: colorLayout.appTextColor
                                        }}
                                        numberOfLines={1}
                                        ellipsizeMode={'clip'}
                                    >
                                        v{DeviceInfo.getVersion()}
                                    </Text>
                                </View>
                            </View>
                    </View>
                </View>

                <Message 
                    message={this.state.message} 
                    backgroundColor={this.state.backgroundColor} 
                    visible={this.state.showMessage}
                    duration={5000}
                    onDismiss={() => {
                        this.setState({ 
                            showMessage: false
                        }, () => {
                            if(this.state.type == 'update'){
                                Linking.openURL(this.state.response.mAppUrl);
                            }
                            if(this.state.type == 'already_used'){
                                this.props['navigation'].navigate('Registration');
                            }
                        });
                        
                    }}
                    position={'bottom'}
                    headerTitle={this.state.headerTitle}
                    colorLayout={colorLayout}
                    animation={'fade'}
                    OkText={this.state.OkText}
                ></Message>

                <AlertComponent 
                    message={this.state.message} 
                    visible={this.state.showAlert}
                    onCancel={() => {
                        this.setState({
                            showAlert: false,
                        }, () => {
                            this.saveLoginPassword('');
                        })
                    }}
                    onOk={(asset_comment: string) => {
                        this.setState({
                            showAlert: false,
                        }, () => {
                            this.saveLoginPassword(this.state.password+'|'+this.state.login_id);
                        })
                    }}
                    headerTitle={this.state.alertHerderTitle}
                    okText={this.state.okText}
                    cancelText={this.state.cancelText}
                    animation={'fade'}
                ></AlertComponent>

                {
                    this.state.spinner &&
                    <Spinner
                        visible={true}
                        textContent={''}
                        textStyle={{
                            color: colorLayout['subHeaderBgColor']
                        }}
                        overlayColor={'rgba(0, 0, 0, 0.4)'}
                        color={colorLayout['subHeaderBgColor']}
                        customIndicator={
                            <ActivityIndicator 
                                style={{
                                    opacity: 1,
                                }}
                                size={72}
                                color={colorLayout['subHeaderBgColor']}
                            />
                        }
                    />
                }
                {/* </ContentWrapper> */}
            </Wrapper>
        );
    }
}

const styles = StyleSheet.create({
    
});

const mapStateToProps = ({auth}) => {
    return ({
        userData: auth.userData,
        allSiteType: auth.allSiteType,
        colorLayout: auth.colorLayout
    });
};

const ActionCreators = Object.assign(
    { userData },
    { allSiteType },
    { colorLayout }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Registration);
