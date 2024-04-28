import React, { PureComponent, useRef } from 'react';
import CryptoJS from "react-native-crypto-js";
import { 
    StyleSheet,
    View,
    Text,
    Dimensions,
    TouchableOpacity,
    PermissionsAndroid,
    Platform,
    LogBox,
    Image,
    StatusBar, 
    ActivityIndicator,
    Keyboard,
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import DeviceInfo from 'react-native-device-info';
import NetInfo from "@react-native-community/netinfo";
import {
    TextField,
} from 'rn-material-ui-textfield';

import Geolocation from 'react-native-geolocation-service';
import messaging from '@react-native-firebase/messaging';

import { getStatusBarHeight } from 'react-native-status-bar-height';

import {requestMultiple, PERMISSIONS, openSettings} from 'react-native-permissions';
import crashlytics from '@react-native-firebase/crashlytics';

import { 
    setRegistrationData,
    setLogoData, setRememberPassword, setLocalUserData, setBasePath, getWelcomeScreenData
} from '../../utilities/helperFunctions';
import { userData, colorLayout } from '../../store/actions';
import { Message, AlertComponent } from '../../components/common';
import { urls, NumericPattern, ALERT_MESSAGES, decrypt, encrypt, checksum, setDomain } from '../../utilities/constants';
import { getService, postService, SendErrorLog } from '../../api-services';

// wrappers
import { 
    Wrapper, TEXT_SIZE_10, TEXT_SIZE_14, TEXT_SIZE_16, 
    TEXT_SIZE_22, BTN_BORDER_RADIUS, ContentWrapper, PADDING_14, APP_PADDING 
} from '../../layout/wrapper';

import * as storage from '../../db';


let screenWidth = Dimensions.get('window').width;
let screenHeight = Dimensions.get('screen').height - (StatusBar.currentHeight as any);
let switched = Dimensions.get('window').height;

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
    _focus_unsubscribe: any

    constructor(props){
        super(props);
    }

    state = {
        registration_code: '',
        showMessage: false,
        message: '',
        backgroundColor: '',
        gpsCoordinate: '',
        deviceid: '',
        osVersion: '',
        device_token: '',
        orientationChanged: false,
        showKeyboard: false,
        loading: false,
        height: screenHeight,
        is_registration_focused: false,
        base_path: '',
        alert_message_showing: false,
        okText: 'Open Setting',
        alertHerderTitle: 'Confirmation',
        mode: 'media',
        openAlertModal: false,
        showAssetCommentBox: false
    };

    async componentDidMount() {
        //PermissionsAndroid.requestMultiple(['android.permission.BLUETOOTH_ADVERTISE', 'android.permission.BLUETOOTH_CONNECT', 'android.permission.BLUETOOTH_SCAN']);
        
        storage.DROP_TABLE_DATA();
        this._focus_unsubscribe = this.props['navigation'].addListener('focus', () => {
            this.setState({
                registration_code: ''
            })
            this.props['navigation'].addListener('blur', () => {
                this._focus_unsubscribe();
                if(this._netunsubscribe){
                    this._netunsubscribe();
                }
            });
            this.setRegistration();
            this.messageAlert();
        });
        this.props['navigation'].addListener('blur', () => {
            this.setState({
                registration_code: ''
            })
            this._focus_unsubscribe();
            if(this._netunsubscribe){
                this._netunsubscribe();
            }
        });
        this.setRegistration();
    }

    async onSignIn(error_log: any) {
        crashlytics().log('Registration screen crash analytics');
        await Promise.all([
          crashlytics().setUserId(error_log.uid),
          crashlytics().setAttributes({
            ...error_log
          }),
        ]);
      }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.onSignIn({
            screen: 'Registration',
            error: error.message,
        });
        crashlytics().crash();
    }

    async setRegistration(){
        setLogoData(null);
        setRememberPassword(null);
        setRegistrationData(null);
        setLocalUserData(null);
        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
        this._unsubscribe = this.props['navigation'].addListener('beforeRemove', (e: any) => {
            if(e.data.action.type == 'GO_BACK'){
                e.preventDefault();
            }
            return;
        });
        DeviceInfo.getUniqueId().then(id => {
            this.setState({
                deviceid: id,
                osVersion: DeviceInfo.getSystemName()+' '+DeviceInfo.getSystemVersion()
            });
        })
        
        if(Platform.OS == 'ios'){
            messaging()
            .getToken()
            .then(token => {
                this.setState({
                    device_token: token
                })
            }).catch((err) => {
                console.log(err)
            })
            
            requestMultiple([
                PERMISSIONS.IOS.CAMERA, 
                PERMISSIONS.IOS.MICROPHONE,
                PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
            ]).then((statuses) => {
                Geolocation.requestAuthorization('whenInUse');
                // Geolocation.setRNConfiguration({
                //     skipPermissionRequests: false,
                //     authorizationLevel: 'whenInUse'
                // });
                this.accessLocation();
                this.checkApplicationPermission();
            });
            
        }else{
            messaging()
            .getToken()
            .then(token => {
                this.setState({
                    device_token: token
                })
            });
            this.hasAndroidPermission().then((res) => {
                this.accessLocation();
            }).catch((err) => {
                this.accessLocation();
            });
        }
    }

    messageAlert(){
        if(this.props['route']){
            if(this.props['route'].params){
                if(this.props['route'].params.showMessage){
                    if(!this.state.alert_message_showing){
                        this.props['navigation'].setParams({showMessage: false});
                        this.setState({
                            showMessage: true,
                            alert_message_showing: true,
                            message: this.props['route'].params.message
                        })
                    }
                    
                }
            }
        }
        this.setViewHeight();
    }

    setViewHeight(height: any = null){
        if(this.state.showKeyboard){
            this.setState({
                height: Dimensions.get('screen').height - getStatusBarHeight()
            })
        }
        if(!this.state.showKeyboard && height){
            this.setState({
                height: height
            })
        }
    }

    async  checkApplicationPermission() {
        const authorizationStatus = await messaging().requestPermission();
        if (authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED) {
            await messaging().getToken()
            .then((token) => {
                this.setState({
                    device_token: token
                })
            }).catch((err) => {
                console.log(err);
            })
         
        } else if (authorizationStatus === messaging.AuthorizationStatus.PROVISIONAL) {
            console.log('User has provisional notification permissions.');
            this.setState({
                device_token: ''
            })
        } 
        else {
            console.log('User has notification permissions disabled');
            this.setState({
                device_token: ''
            })
        }
    }

    componentWillUnmount(){
        // if(this._unsubscribe){
        //     this._unsubscribe();
        // }

        // if(this._netunsubscribe){
        //     this._netunsubscribe();
        // }
        // if(this._focus_subscribe){
        //     this._focus_subscribe();
        // }
    }

    async requestPermission() {
        const granted = await messaging().requestPermission({
          alert: true,
          announcement: false,
          badge: true,
          carPlay: true,
          provisional: false,
          sound: true,
        });
        if (granted) {
          const fcmToken = await messaging().getToken();
          console.log('User granted messaging permissions!');
        } else {
          console.log('User declined messaging permissions :(');
        }
      }

    async checkPermissions(){
        PermissionsAndroid.check('android.permission.ACCESS_FINE_LOCATION').then(p => {
            if(p){
                if(Platform.constants['Release'] >= 13){
                    PermissionsAndroid.check('android.permission.RECORD_AUDIO').then(p4 => {
                        if(p4){
                            PermissionsAndroid.check('android.permission.CAMERA').then(p5 => {
                                if(p5){
                                    this.checkConnectivity();
                                }else{

                                    this.openCameraPermission();

                                }
                            })
                        }else{
                            this.openMicrophonePermission();
                        }
                    })
                }else{
                    
                    PermissionsAndroid.check('android.permission.READ_EXTERNAL_STORAGE').then(p2 => {
                        if(p2){
                            PermissionsAndroid.check('android.permission.WRITE_EXTERNAL_STORAGE').then(p3 => {
                                if(p3){
                                    PermissionsAndroid.check('android.permission.RECORD_AUDIO').then(p4 => {
                                        if(p4){
                                            PermissionsAndroid.check('android.permission.CAMERA').then(p5 => {
                                                if(p5){
                                                    this.checkConnectivity();
                                                }else{
    
                                                    this.openCameraPermission();
    
                                                }
                                            })
                                        }else{
                                            this.openMicrophonePermission();
                                        }
                                    })
                                }else{
                                    this.setState({
                                        openAlertModal: true,
                                        backgroundColor: color.danger,
                                        message: "Registration requires write files permission",
                                        okText: 'Open Setting',
                                        alertHerderTitle: 'Confirmation',
                                        mode: 'media'
                                    });
                                }
                            })
                        }else{
                            this.setState({
                                openAlertModal: true,
                                backgroundColor: color.danger,
                                message: "Registration requires read files permission",
                                okText: 'Open Setting',
                                alertHerderTitle: 'Confirmation',
                                mode: 'media'
                            });
                        }
                    })
                }
                
            }else{
                this.openLocationPermission();
            }
        })
    }

    checkConnectivity = async () => {        
        var net = await NetInfo.fetch();
        // this._netunsubscribe = NetInfo.addEventListener(net => {
            if(net.isConnected && net.isInternetReachable){
                this.setState({
                    loading: true
                })
                if(this.state.gpsCoordinate){
                    this.registerUser();
                }else{
                    this.accessLocation(true);
                }
                
            }else{
                this.setState({
                    showMessage: true,
                    backgroundColor: color.danger,
                    message: 'Internet connection is not available',
                });
            }
        // });
    };

    registerUser(){
        if(!this.state.gpsCoordinate){
            this.setState({
                loading: false,
                showMessage: true,
                backgroundColor: color.danger,
                message: 'Location is required to register',
            })
            return;
        }
        var postData = {
            regcode: this.state.registration_code,
            deviceid: this.state.deviceid,
            osVersion: this.state.osVersion,
            gpsCoordinate: this.state.gpsCoordinate,
            appVersion: DeviceInfo.getVersion()
        };

        postService(urls.register, postData).then((res: any) => {
            
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => RegistrationScreen > Method => registerUser @ api => '+urls.register+' @ params => '+JSON.stringify(postData), 'Error While registering');
                }
            }
            if(res.responseCode == 2000){

                setDomain(encrypt(res.responseData.clientId));

                this.setState({
                    loading: false
                }, () => {
                    res.responseData.device_token = this.state.device_token;
                    res.responseData.regcode = this.state.registration_code;
                    
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
                })
                
            }else{
                this.setState({
                    showMessage: true,
                    loading: false,
                    backgroundColor: color.danger,
                    message: res.responseMessage.split('_').join(' '),
                });
            }
        })
        .catch((error) => {
            console.log(error);
            if(error.status != 200){
                this.setState({
                    showMessage: true,
                    loading: false,
                    backgroundColor: color.danger,
                    message: ALERT_MESSAGES.server_not_connected,
                });
            }
            SendErrorLog('Screen => RegistrationScreen > Method => registerUser @ api => '+urls.register+' @ params => '+JSON.stringify(postData), error.message);
        })

    }

    hasAndroidPermission = () => new Promise(async (resolve, reject) => {
        
        const grants = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.CAMERA
        ]);
        if (
            grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
            grants['android.permission.READ_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
            grants['android.permission.RECORD_AUDIO'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
            grants['android.permission.ACCESS_FINE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
            grants['android.permission.CAMERA'] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
            resolve(true);
        } 
        else {
            reject(true);
        }
        
    });


    accessLocation(redirect: boolean = false){
        Geolocation.getCurrentPosition(info => {
            var lat = info.coords.latitude.toString();
            var lng  = info.coords.longitude.toString();
            this.setState({
                gpsCoordinate: lat.split('.')[0]+'.'+lat.split('.')[1].substring(0,6)+','+lng.split('.')[0]+'.'+lng.split('.')[1].substring(0,6)
            }, () => {
                if(redirect){
                    this.registerUser();
                }
            });
            
        }, (err) => {
            if(redirect){
                this.setState({
                    loading: false,
                    showMessage: true,
                    backgroundColor: color.danger,
                    message: 'Location co-ordinates is required to register',
                })
            }
            // this.setState({
            //     gpsCoordinate: null
            // });
            this.setState({
                gpsCoordinate: '0,0'
            }, () => {
                if(redirect){
                    this.registerUser();
                }
            });
        },{enableHighAccuracy: false, timeout: 2000000, maximumAge: 100000});
        // Geolocation.getCurrentPosition(info => {
        //     this.setState({
        //         gpsCoordinate: info.coords.latitude+','+info.coords.longitude
        //     });
        // }, (err) => {
        //     this.setState({
        //         gpsCoordinate: null
        //     });
        // });
    }

    validateUser() {
        if(this.state.registration_code){
            if(Platform.OS == 'ios'){
                requestMultiple([
                    PERMISSIONS.IOS.CAMERA, 
                    PERMISSIONS.IOS.MICROPHONE,
                    PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
                ]).then((statuses) => {
                    if(statuses[PERMISSIONS.IOS.CAMERA] !== 'granted'){
                        this.openCameraPermission();
                    }
                    else if(statuses[PERMISSIONS.IOS.MICROPHONE] !== 'granted'){
                        this.openMicrophonePermission();
                    }
                    else if(statuses[PERMISSIONS.IOS.LOCATION_WHEN_IN_USE] !== 'granted'){
                        this.openLocationPermission();
                    }else{
                        this.checkConnectivity();
                    }
                });
                
            }else{
                this.checkPermissions();
            }
        }else{
            this.setState({
                showMessage: true,
                backgroundColor: color.danger,
                message: "Enter registration code",
            });
        }
    }

    openCameraPermission(){
        this.setState({
            openAlertModal: true,
            backgroundColor: color.danger,
            message: "Camera permission is required for application",
            okText: 'Turn On',
            alertHerderTitle: 'Alert',
            mode: 'media'
        });
    }

    openMicrophonePermission(){
        this.setState({
            openAlertModal: true,
            backgroundColor: color.danger,
            message: "Microphone permission is required for application",
            okText: 'Turn On',
            alertHerderTitle: 'Alert',
            mode: 'media'
        });
    }

    openLocationPermission(){
        this.setState({
            openAlertModal: true,
            backgroundColor: color.danger,
            message: "Location service is required for application",
            okText: 'Turn On',
            alertHerderTitle: 'Alert',
            mode: 'media'
        });
    }

    render() {
        const { colorLayout } = this.props as any;

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
                    
                    {/* <View
                        style={{
                            flex: 1,
                            backgroundColor: '#fff',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            
                        }}
                    > */}
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
                                flex: 1,
                                backgroundColor: '#fff',
                                justifyContent: 'flex-end'
                            }}
                        >

                        
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
                                Application Registration
                            </Text>

                            <Text
                                style={{
                                    fontSize: TEXT_SIZE_16,
                                    color: colorLayout.subTextColor,
                                    marginVertical: 10,
                                }}
                            >
                                Enter registration code
                            </Text>
                        </View>

                            <TextField
                                label="Registration Code"
                                lineWidth={this.state.is_registration_focused ? 2 : this.state.registration_code ? 2 : 1}
                                value={this.state.registration_code}
                                onChangeText={(text: string) => {
                                    if(text.length < 9){
                                        this.setState({ registration_code: NumericPattern(text.slice(0, 8)).trim() });
                                    }
                                }}
                                baseColor={
                                    this.state.is_registration_focused 
                                    ? 
                                    '#000' : this.state.registration_code ? '#000' : 'rgba(0,0,0,0.5)'
                                }
                                tintColor={
                                    this.state.is_registration_focused 
                                    ? 
                                    '#000' : this.state.registration_code ? '#000' : 'rgba(0,0,0,0.5)'
                                }
                                characterRestriction={8}
                                keyboardType="phone-pad"
                                style={{
                                    color: '#000'
                                }}
                                inputRef={(ref) => {
                                    if(ref){
                                        
                                    }
                                }}  
                                titleTextStyle={{
                                    display: 'none'
                                }}  
                                inputContainerStyle={{
                                    
                                }} 
                                onFocus={() => {
                                    this.setState({
                                        is_registration_focused: true
                                    })
                                }} 
                                onBlur={() => {
                                    this.setState({
                                        is_registration_focused: false
                                    })
                                }}  
                                fontSize={this.state.is_registration_focused ? TEXT_SIZE_16 : TEXT_SIZE_14}
                                contentInset={{
                                    top: this.state.is_registration_focused ? 0 : 10,
                                    input: 2
                                }}
                            />
                            
                            <View
                                style={{
                                    marginTop: 10,
                                    // marginBottom: 5
                                }}
                            >

                                {
                                    this.state.loading &&
                                    <View
                                        style={{
                                            position: 'absolute',
                                            zIndex: 2,
                                            marginTop: 7,
                                            display: this.state.loading ? 'flex' : 'none',
                                            paddingLeft: (screenWidth - 40)/2 - 20,
                                        }}
                                    >
                                        <ActivityIndicator 
                                            size="large" 
                                            color={colorLayout.headerBgColor} 
                                            style={{
                                                
                                            }}
                                        />
                                    </View>
                                }
                                
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: colorLayout['subHeaderBgColor'],
                                        position: 'relative',
                                        opacity: this.state.loading ? 0.4 : 1,
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        paddingVertical: PADDING_14,
                                        borderRadius: BTN_BORDER_RADIUS
                                    }}
                                    onPress={() => {
                                        // start native module
                                        // CalendarModule.createCalendarEvent(Date.now().toString(), 'testLocation', (eventId: number) => {
                                        //     console.log(`Created a new event with id ${eventId}`);
                                        // });

                                        // RFIDModule.createRfidEvent(Date.now().toString(), 'testLocation', (eventId: number, text: string) => {
                                        //     console.log(text);
                                        //     console.log(`Created a new event with id ${eventId}`);
                                        // });
                                        // RFIDModule.getRfidTagsData((data: any) => {
                                        //     alert(data);
                                        // });
                                        // end native module
                                        if(this.state.base_path){
                                            setBasePath(this.state.base_path);
                                        }
                                        Keyboard.dismiss();
                                        this.validateUser();
                                    }}
                                    disabled={this.state.loading}
                                    activeOpacity={0.9}
                                >

                                    <Text
                                        style={{
                                            color: colorLayout['headerTextColor'],
                                            fontSize: TEXT_SIZE_16,
                                            textAlignVertical: 'center',
                                            fontWeight: '500',
                                            textAlign: 'center'
                                        }}
                                    >
                                        Register
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
                    {/* </View> */}
                    
                {/* </ContentWrapper> */}

                <Message 
                    message={this.state.message} 
                    backgroundColor={this.state.backgroundColor} 
                    visible={this.state.showMessage}
                    duration={5000}
                    onDismiss={() => {
                        this.setState({
                            showMessage: false
                        });
                    }}
                    position={'bottom'}
                    headerTitle={'Alert'}
                    colorLayout={colorLayout}
                    animation={'fade'}
                ></Message>

                <AlertComponent 
                    message={this.state.message} 
                    visible={this.state.openAlertModal}
                    onCancel={() => {
                        this.setState({
                            openAlertModal: false,
                            showAssetCommentBox: false
                        })
                    }}
                    onOk={(asset_comment: string) => {
                        this.setState({
                            openAlertModal: false,
                            showAssetCommentBox: false
                        }, () => {
                            if(this.state.mode == 'media'){
                                this.setState({
                                    openAlertModal: false,
                                    showAssetCommentBox: false
                                }, () => {
                                    openSettings();
                                })
                            }
                        })
                    }}
                    headerTitle={this.state.alertHerderTitle}
                    okText={this.state.okText}
                    cancelText={'No'}
                    showCommentBox={false}
                    commentValue={''}
                    showCancel={false}
                ></AlertComponent>

            </Wrapper>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
});

const mapStateToProps = ({auth}) => {
    return ({
        userData: auth.userData,
        colorLayout: auth.colorLayout
    });
};

const ActionCreators = Object.assign(
    {  },
    { userData },
    { colorLayout }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Registration);
