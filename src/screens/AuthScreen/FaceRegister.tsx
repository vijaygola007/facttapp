import React, { PureComponent, useRef } from 'react';
import { 
    StyleSheet,
    View,
    Text,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    LogBox,
    StatusBar
} from 'react-native';
import { Button, Icon, Input } from 'react-native-elements';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Spinner from 'react-native-loading-spinner-overlay';
import NetInfo from "@react-native-community/netinfo";

import {RNCamera as RNCameraImage} from 'react-native-camera';
import RNFetchBlob from 'rn-fetch-blob';
import crashlytics from '@react-native-firebase/crashlytics';

import { requestMultiple, PERMISSIONS} from 'react-native-permissions';

import { userData, colorLayout } from '../../store/actions';
import { Message } from '../../components/common';
import { postService, SendErrorLog } from '../../api-services';
import { urls } from '../../utilities/constants';

import { setFaceRegistered } from '../../utilities/helperFunctions';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('screen').height - (StatusBar.currentHeight as any);

const color = {
    danger: '#CD3D3E',
    warning: '#EB9D3E',
    success: '#4DAD49',
    info: '#4CB3D5',
    default: '#565656'
}


class FaceRegister extends PureComponent {


    _unsubscribe: any;
    state = {
        response: this.props['route']['params']['props'],
        showMessage: false,
        message: '',
        backgroundColor: '',
        cameraData: null,
        base64: '',
        isImageCaptured: false,
        spinner: false,
        height: screenHeight,
        cameraStatus: '',
        image: require('../../../assets/img/factt-logo.png'),
    };
    
    componentDidMount() {
        this.verifyPermission();
        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
        this._unsubscribe = this.props['navigation'].addListener('beforeRemove', (e: any) => {
            if(e.data.action.type == 'GO_BACK'){
                e.preventDefault();
            }
            return;
        });
    }

    componentWillUnmount(){
        // if(this._unsubscribe){
        //     this._unsubscribe();
        // }
    }


    async onSignIn(error_log: any) {
        crashlytics().log('Face register screen crash analytics');
        await Promise.all([
          crashlytics().setUserId(error_log.uid),
          crashlytics().setAttributes({
            ...error_log
          }),
        ]);
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.onSignIn({
            screen: 'Face Register',
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

    takePicture = async () => {

        var net = await NetInfo.fetch();
        if(net.isConnected && net.isInternetReachable){
            if (this.state.cameraData) {
                const options = { 
                    quality: 0.85, 
                    base64: true,
                    fixOrientation: true, 
                    forceUpOrientation: true,
                    mirrorImage: true
                };
                const data = await (this.state.cameraData as any).takePictureAsync(options);
                
                this.setState({
                    base64: 'data:image/jpeg;base64,'+data.base64,
                    isImageCaptured: true
                }, () => {
                    RNFetchBlob.fs.unlink(data.uri);
                });
            }
        }else{
            this.setState({
                showMessage: true,
                spinner: false,
                backgroundColor: color.danger,
                isImageCaptured: false,
                message: 'Internet connection is not available',
            });
        }
        
    };

    registerFace(){
        var postData = {
            secretkey: this.state.response.secretKey,
            photo: this.state.base64
        };
        this.setState({
            spinner: true
        });
        postService(urls.register_face, postData).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => FaceRegister > Method => registerFace @ api => '+urls.register_face+' @ params => '+JSON.stringify(postData), 'Error While getting login');
                }
            }
            if(res.responseCode == 2000){
                this.setState({
                    showMessage: true,
                    spinner: false,
                    backgroundColor: color.success,
                    message: 'Your registration has been completed',
                }, () => {
                    setFaceRegistered('yes');
                });
            }else{
                this.setState({
                    showMessage: true,
                    spinner: false,
                    backgroundColor: color.danger,
                    message: res.responseMessage.split('_').join(' '),
                });
            }
        })
        .catch((error) => {
            SendErrorLog('Screen => FaceRegister > Method => registerFace @ api => '+urls.register_face+' @ params => '+JSON.stringify(postData), error.message);
            this.setState({
                spinner: false,
            });
        });
    }

    render() {
        
        const { colorLayout } = this.props as any;
        const { height } = this.state;

        return (
            // <SafeAreaView>
                
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                onLayout={(evt) => {
                    this.setState({
                        height: evt.nativeEvent.layout.height
                    })
                }}
            >
                <View
                    style={{
                        flex: 1,
                        paddingTop: 30,
                    }}
                >

                    <Image
                        style={styles.logo}
                        source={this.state.image} 
                    />


                    <Text
                        style={{...styles.text, color: colorLayout.color_2}}
                    >
                        Register yourself by scanning your face
                    </Text>

                    {
                        this.state.isImageCaptured &&
                        <Image
                            style={{
                                ...styles.image_preview,
                                display: this.state.base64 ? 'flex' : 'none',
                                borderWidth: 1,
                                borderColor: colorLayout.headerBgColor
                            }}
                            source={{uri: this.state.base64}} 
                        />
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
                        <RNCameraImage
                            ref={(ref: any) => {
                                this.state.cameraData = ref;
                            }}
                            style={{
                                ...styles.preview,
                                display: this.state.base64 ? 'none' : 'flex',
                                borderWidth: 1,
                                borderColor: colorLayout.headerBgColor
                            }}
                            type={RNCameraImage.Constants.Type.front}
                            flashMode={RNCameraImage.Constants.FlashMode.off}
                            androidCameraPermissionOptions={{
                                title: 'Permission to use camera',
                                message: 'We need your permission to use your camera',
                                buttonPositive: 'Ok',
                                buttonNegative: 'Cancel',
                            }}
                            androidRecordAudioPermissionOptions={{
                                title: 'Permission to use audio recording',
                                message: 'We need your permission to use your audio',
                                buttonPositive: 'Ok',
                                buttonNegative: 'Cancel',
                            }}
                        />
                    }

                    {
                        this.state.cameraStatus == 'granted' &&
                        <View 
                            style={{
                                ...styles.capture_box,
                                display: this.state.base64 ? 'none' : 'flex'
                            }}
                        >
                            <TouchableOpacity 
                                onPress={() => {
                                    if(!this.state.isImageCaptured){
                                        this.setState({
                                            isImageCaptured: true
                                        }, () => {
                                            // this.takePicture.bind(this)
                                            this.takePicture();
                                        })
                                    }
                                }} 
                                style={{...styles.capture_btn, backgroundColor: colorLayout.subHeaderBgColor}}
                                disabled={this.state.base64 ? true : false}
                            >
                                <Icon
                                    name='camera'
                                    type='font-awesome'
                                    color={colorLayout.headerTextColor}
                                    containerStyle={{
                                        marginTop: 15
                                    }}
                                    iconStyle={{
                                        fontSize: 30,
                                    }}
                                    
                                />
                            </TouchableOpacity>
                            <Text
                                style={{
                                    color: colorLayout.headerTextColor,
                                    textAlign: 'center',
                                    alignSelf: 'center',
                                    fontSize: 15,
                                    fontWeight: '600'
                                }}
                            >
                                Click on camera icon to capture image
                            </Text>
                        </View>
                    }

                    <View
                        style={{
                            ...styles.capture_box,
                            display: this.state.base64 ? 'flex' : 'none',
                            alignSelf: 'flex-end'
                        }}
                    >

                        <TouchableOpacity
                            style={{
                                ...styles.capture_btn,
                                padding: 10,
                                backgroundColor: colorLayout.subHeaderBgColor,
                                marginRight: 30,
                                marginTop: screenHeight * 0.09
                            }}
                            onPress={() => {
                                this.setState({
                                    base64: '',
                                    isImageCaptured: false
                                })
                            }}
                            activeOpacity={0.9}
                        >

                            <Icon
                                name='delete'
                                type='antdesign'
                                color={colorLayout.headerTextColor}
                                containerStyle={{
                                    alignSelf: 'center',
                                    marginLeft: 0
                                }}
                                iconStyle={{
                                    fontSize: 38,
                                }}
                                
                            />

                        </TouchableOpacity>

                    </View>


                </View>


                <View
                    style={{
                        paddingBottom: 20,
                        width: screenWidth * 0.95,
                        alignSelf: 'center',
                        opacity: this.state.isImageCaptured ? 1 : 0.8
                    }}
                >

                    <TouchableOpacity
                        style={{
                            backgroundColor: colorLayout.subHeaderBgColor,
                            paddingVertical: 15,
                            borderRadius: 8
                        }}
                        onPress={() => {
                            if(this.state.isImageCaptured){
                                if(this.state.base64){
                                    this.registerFace();
                                }else{
                                    alert('Please capture image');
                                }
                            }
                        }}
                        activeOpacity={1}
                    >
                        <Text
                            style={{
                                color: colorLayout.headerTextColor,
                                fontSize: 16,
                                textAlign: 'center',
                                fontWeight: '600',
                                letterSpacing: 0.1,
                                textAlignVertical: 'center'
                            }}
                        >
                            REGISTER
                        </Text>
                    </TouchableOpacity>

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
                        this.setState({
                            showMessage: false
                        },() => {
                            this.props['navigation'].navigate('FaceLogin', {
                                props: this.state.response,
                            });
                        });
                    }}
                    position={'bottom'}
                    showOk={true}
                    OkText={'Continue'}
                    colorLayout={colorLayout}
                ></Message>

                {/* <Connectivity {...this.props} /> */}

            </KeyboardAvoidingView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        flex: 1,
    },
    logo: {
        width: 150,
        height: 60,
        alignSelf: 'center'
    },
    image_preview: {
        height: screenHeight * 0.6,
        width: screenWidth * 0.95,
        borderRadius: 8,
        alignSelf: 'center',
    },
    text: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 10
    },
    text_2: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 10,
        opacity: 0.6
    },
    preview: {
        justifyContent: 'flex-end',
        alignItems: 'center',
        height: screenHeight * 0.6,
        width: screenWidth * 0.95,
        overflow: 'hidden',
        borderRadius: 8,
        alignSelf: 'center'
    },
    capture_box:{ 
        flexDirection: 'column', 
        justifyContent: 'center',
        position: 'absolute',
        marginTop: screenHeight * 0.6,
        alignSelf: 'center'
    },
    capture_btn: {
        backgroundColor: '#062656',
        borderRadius: 50,
        marginVertical: 20,
        height: 60,
        width: 60,
        alignSelf: 'center'
    },
});

const mapStateToProps = ({ auth }) => {
    return ({
        userData: auth.userData,
        colorLayout: auth.colorLayout
    });
};

const ActionCreators = Object.assign(
    { userData },
    { colorLayout }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(FaceRegister);
