import React, { PureComponent, useRef } from 'react';
import { 
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    LogBox,
    ActivityIndicator,
    BackHandler
} from 'react-native';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import RNFetchBlob from 'rn-fetch-blob';
import Spinner from 'react-native-loading-spinner-overlay';
import NetInfo from "@react-native-community/netinfo";
import RNExitApp from 'react-native-exit-app';

import {request, requestMultiple, checkMultiple, PERMISSIONS} from 'react-native-permissions';

import crashlytics from '@react-native-firebase/crashlytics';

import { setLocalUserData, getRegistrationData, getLogoData, setConnectivityModal } from '../../utilities/helperFunctions';
import { userData, colorLayout, allSiteType } from '../../store/actions';
import { FaceDetectionComponent, Message, Connectivity } from '../../components/common';
import { getService, SendErrorLog } from '../../api-services';
import { urls } from '../../utilities/constants';

import * as storage from '../../db';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const color = {
    danger: '#CD3D3E',
    warning: '#EB9D3E',
    success: '#4DAD49',
    info: '#4CB3D5',
    default: '#565656'
}


class FaceLogin extends PureComponent {

    _unsubscribe: any;
    state = {
        login_id: '',
        password: '',
        response: null,
        showMessage: false,
        message: '',
        backgroundColor: '',
        captureImage: false,
        spinner: false,
        cameraStatus: '',
        image: require('../../../assets/img/factt-logo.png'),
        hasLogoData: false,
        login_failed_msg: 'User verfication failed, retrying...',
        user_verification_failed: false,
        type: '',
        headerTitle: ''
    };
    
    componentDidMount() {
        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
        this.getData();
        this.verifyPermission();
        this.props['navigation'].addListener('beforeRemove', (e: any) => {
            if(e.data.action.type == 'GO_BACK'){
                e.preventDefault();
            }
            return;
        });



        this.props['navigation'].addListener('focus', (e: any) => {
           this.getData();
           this.verifyPermission();
        });
    }

    componentWillUnmount(){
        
    }

    async onSignIn(error_log: any) {
        crashlytics().log('Face Login screen crash analytics');
        await Promise.all([
          crashlytics().setUserId(error_log.uid),
          crashlytics().setAttributes({
            ...error_log
          }),
        ]);
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.onSignIn({
            screen: 'Face Login',
            error: error.message,
        });
        crashlytics().crash();
    }

    verifyPermission = () => {
        if(Platform.OS == 'ios'){
            requestMultiple([PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.MICROPHONE]).then((statuses) => {
                this.setState({
                    cameraStatus: statuses[PERMISSIONS.IOS.CAMERA]
                })
            });
        }else{
            requestMultiple([PERMISSIONS.ANDROID.CAMERA]).then((statuses) => {
                this.setState({
                    cameraStatus: statuses[PERMISSIONS.ANDROID.CAMERA]
                })
            });
        }
    }

    getData(){
        storage.DELETE_TABLE_DATA();
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
        getRegistrationData().then((r: any) => {
            this.setState({
                response: r,
                captureImage: false
            })
        });
    }

    authenticateFace(res: any){
        const { colorLayout } = this.props as any;
        const { response } = this.state as any;
        var user_data = {
            regcode: response.regcode,
            deviceToken: response.device_token,
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
                    SendErrorLog('Screen => FaceLoginScreen > Method => getUserLayout @ api => '+urls.token_info, 'Error While getting token info');

                }
            }
            if(token_info.responseCode == 2000){
                for(var key in token_info.responseData){
                    user_data[key] = token_info.responseData[key];
                }

                var path = `${urls.domain}images/tenantlogo/${user_data['tenantCode']}.png`;
                RNFetchBlob.fetch('GET',`${path}`)
                .then((data) => {
                    let status = data.info().status;
                    if(status == 200){
                        user_data['app_logo'] = 'data:image/png;base64,'+data.base64()
                    }
                    this.props['actions'].userData({
                        data: user_data
                    });
                    getService(urls.layout).then((res: any) => {
                        if(res){
                            if(res.responseCode == 5001 || res.responseCode == 5002){
                                SendErrorLog('Screen => FaceLoginScreen > Method => getLayoutData @ api => '+urls.layout, 'Error While getting layout data');
                            }
                        }
                        if(res.responseCode == 2000){
                            user_data['layoutData'] = res.responseData.layoutData;
                            user_data['layoutName'] = res.responseData.layoutName;
                        
                            var colors = JSON.parse(JSON.stringify(colorLayout));
                            colors['headerBgColor'] = res.responseData.layoutData ? res.responseData.layoutData.headerBgColor : colorLayout.headerBgColor;
                            colors['headerTextColor'] = res.responseData.layoutData ? res.responseData.layoutData.headerTextColor : colorLayout.headerTextColor;
                            colors['appBgColor'] = res.responseData.layoutData ? res.responseData.layoutData.appBgColor : colorLayout.appBgColor;
                            colors['cardBgColor'] = res.responseData.layoutData ? res.responseData.layoutData.cardBgColor : colorLayout.cardBgColor;
                            colors['appTextColor'] = res.responseData.layoutData ? res.responseData.layoutData.appTextColor : colorLayout.appTextColor;
                            colors['subTextColor'] = res.responseData.layoutData ? res.responseData.layoutData.subTextColor : colorLayout.subTextColor;
                            colors['subHeaderBgColor'] = res.responseData.layoutData ? res.responseData.layoutData.subHeaderBgColor : colorLayout.subHeaderBgColor;
                            colors['systemHeaderBgColor'] = res.responseData.layoutData ? res.responseData.layoutData.systemHeaderBgColor : colorLayout.systemHeaderBgColor;
                
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
                                    backgroundColor: color.danger,
                                    message: 'Unable to login',
                                    headerTitle: 'Alert',
                                    type: 'creds',
                                    spinner: false
                                });
                            })
                        }else{
                            this.setState({
                                user_verification_failed: true
                            })
                        }
                    })
                    .catch((error) => {
                        SendErrorLog('Screen => FaceLoginScreen > Method => getLayoutData @ api => '+urls.layout, error.message);
                        this.setState({
                            showMessage: true,
                            backgroundColor: color.danger,
                            message: 'Unable to login',
                            headerTitle: 'Alert',
                            type: 'creds',
                            spinner: false
                        });
                    })
                }).catch((err) => {
                    SendErrorLog('Screen => FaceLoginScreen > Method => getLayoutData @ api => '+path, err.message);
                    this.setState({
                        showMessage: true,
                        backgroundColor: color.danger,
                        message: 'Unable to login',
                        headerTitle: 'Alert',
                        type: 'creds',
                        spinner: false
                    });
                });
                this.props['actions'].userData({
                    data: user_data
                });
            }else{
                this.setState({
                    showMessage: true,
                    backgroundColor: color.danger,
                    message: 'Something went wrong, close your application and please try again',
                    headerTitle: 'Alert',
                    type: 'kill_app',
                    spinner: false
                });
            }
            
        })
        .catch((error) => {
            SendErrorLog('Screen => FaceLoginScreen > Method => getUserLayout @ api => '+urls.token_info, error.message);
            this.setState({
                showMessage: true,
                backgroundColor: color.danger,
                message: 'Unable to login',
                headerTitle: 'Alert',
                type: 'creds',
                spinner: false
            });
        });
        
    }

    async GetAllData(colors: any){

        await getService(urls.master_all).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => FaceLoginScreen > Method => GetAllData @ api => '+urls.master_all, 'Error While getting master data');
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
            
            SendErrorLog('Screen => FaceLoginScreen > Method => GetAllData @ api => '+urls.master_all, error.message);
        })

        await getService(urls.user_category).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => FaceLoginScreen > Method => GetAllData @ api => '+urls.user_category, 'Error While getting user category');
                }
            }
            storage.insertUserCategoryData_TBL(res.responseCode == 2000 ? res.responseData : []);
        }).catch((error) => {

            SendErrorLog('Screen => FaceLoginScreen > Method => GetAllData @ api => '+urls.user_category, error.message);
        });

        await getService(urls.inspections).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => FaceLoginScreen > Method => GetAllData @ api => '+urls.inspections, 'Error While getting inspections');
                }
            }
            storage.insertInspectionsData_TBL(res.responseCode == 2000 ? res.responseData : []);
        }).catch((error) => {

            SendErrorLog('Screen => FaceLoginScreen > Method => GetAllData @ api => '+urls.inspections, error.message);
        });

        await getService(urls.mobile_data).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => FaceLoginScreen > Method => GetAllData @ api => '+urls.mobile_data, 'Error While getting mobile data');
                }
            }
            storage.insertAllMobileData_TBL(res.responseCode == 2000 ? res.responseData.inspections : []);
            setConnectivityModal('');
            this.setState({
                spinner: false,
                captureImage: false
            }, () => {
                this.props['navigation'].navigate('ScreenNavigator', {
                    screen: 'DrawerNavigator',
                    params: {
                        colorLayout: colors
                    }
                });
            })
        }).catch((error) => {
            SendErrorLog('Screen => FaceLoginScreen > Method => GetAllData @ api => '+urls.mobile_data, error.message);
        });

    }

    render() {
        
        const { colorLayout } = this.props as any;

        return (
            // <SafeAreaView>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View
                    style={{
                        flex: 1,
                        paddingTop: 30,
                        alignItems: 'center'
                    }}
                >

                    <Image
                        style={styles.logo}
                        source={this.state.image} 
                    />

                    <Text
                        style={{...styles.text, color: colorLayout.appTextColor}}
                    >
                        User Authentication
                    </Text>

                    <Text
                        style={{
                            ...styles.text_2, 
                            color: '#000',
                        }}
                    >
                        Face identification and verification
                    </Text>



                    {
                        this.state.user_verification_failed &&
                        <Text
                            style={{
                                color: '#ff0000',
                                textAlign: 'center',
                                fontSize: 16
                            }}
                        >
                            {this.state.login_failed_msg}
                        </Text>

                    }

                    {
                        (this.state.cameraStatus == 'blocked' || this.state.cameraStatus == 'denied') &&
                        <Text style={{
                            paddingTop: (screenHeight * 0.7)/2,
                            textAlign: 'center'
                        }}>FACTT cann't access camera</Text>
                    }

                    {
                        this.state.cameraStatus == 'granted' &&
                        <View
                            style={{
                                height: 290,
                                width: 290,
                            }}
                        >
                            {
                                this.state.response &&
                                <FaceDetectionComponent 
                                    captureImage={false}
                                    onFaceQueued={(isFaceCaptured) => {
                                        this.setState({
                                            spinner: isFaceCaptured ? true : false
                                        })
                                    }}
                                    onFaceCapture={async (data: any) => {
                                        if(data){
                                            var net = await NetInfo.fetch();
                                            if(net.isConnected && net.isInternetReachable){
                                                this.authenticateFace(data);
                                            }else{

                                            }
                                        }else{
                                            this.setState({
                                                showMessage: true,
                                                backgroundColor: color.danger,
                                                message: 'Registration code already used',
                                                headerTitle: 'Alert',
                                                type: 'already_used'
                                            });
                                        }
                                    }}
                                    response={this.state.response}
                                    props={this.props}
                                />
                            }

                        </View>
                    }

                </View>

                {
                    this.state.cameraStatus == 'granted' &&
                    <View
                        style={{
                            alignItems: 'center',
                            marginTop: 10
                        }}
                    >
                        <Image 
                            source={require(`../../../assets/img/scan_face.gif`)}  
                            style={{height:100, width: 100 }} 
                        /> 
                    </View>
                }

                <View
                    style={{
                        paddingBottom: 40,
                        paddingHorizontal: 15
                    }}
                >

                    {
                        this.state.cameraStatus == 'granted' &&
                        <Text
                            style={{...styles.text, color: colorLayout.color_2, fontWeight: '400'}}
                        >
                            Scanning...
                        </Text>

                    }

                    <Text
                        style={{
                            color: colorLayout.color_2, 
                            textAlign: 'center', 
                            marginTop: 10, 
                            fontSize: 16,
                        }}
                    >
                        This operation can take a few minutes to process.
                    </Text>

                </View> 


                <Spinner
                    visible={this.state.spinner}
                    textContent={''}
                    textStyle={{
                        color: colorLayout['subHeaderBgColor']
                    }}
                    overlayColor={'rgba(0, 0, 0, 0.4)'}
                    color={colorLayout['subHeaderBgColor']}
                    indicatorStyle={{

                    }}
                    customIndicator={
                        <ActivityIndicator 
                            style={{
                                opacity: 1
                            }}
                            size={100}
                            color={colorLayout['subHeaderBgColor']}
                        />
                    }
                />

                <Message 
                    message={this.state.message} 
                    backgroundColor={this.state.backgroundColor} 
                    visible={this.state.showMessage}
                    duration={5000}
                    onDismiss={() => {
                        if(this.state.type == 'creds'){
                            this.setState({
                                showMessage: false
                            });
                        }
                        if(this.state.type == 'already_used'){
                            this.setState({
                                showMessage: false
                            }, () => {
                                this.props['navigation'].navigate('Registration');
                            });
                        }
                        if(this.state.type == 'kill_app'){
                            this.setState({
                                showMessage: false
                            }, () => {
                                // BackHandler.exitApp();
                                RNExitApp.exitApp();
                            });
                        }
                    }}
                    position={'bottom'}
                    colorLayout={colorLayout}
                    headerTitle={this.state.headerTitle}
                ></Message>


                {/* <Connectivity {...this.props} /> */}

            </KeyboardAvoidingView>
            // </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        flex: 1,
    },

    spinnerTextStyle: {
        color: '#FFF'
    },
    logo: {
        width: 150,
        height: 60,
        alignSelf: 'center'
    },
    text: {
        fontSize: 30,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 10
    },
    text_2: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 10,
    }
});

const mapStateToProps = ({ auth }) => {
    return ({
        userData: auth.userData,
        colorLayout: auth.colorLayout,
        allSiteType: auth.allSiteType
    });
};

const ActionCreators = Object.assign(
    { userData },
    { colorLayout }, 
    { allSiteType }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(FaceLogin);
