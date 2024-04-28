import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, ActivityIndicator } from 'react-native';

import {RNCamera, RNCamera as RNCameraImage} from 'react-native-camera';
import * as Animatable from 'react-native-animatable';
import RNFetchBlob from 'rn-fetch-blob';
import NetInfo from "@react-native-community/netinfo";
import Spinner from 'react-native-loading-spinner-overlay';
import { postService, SendErrorLog } from '../../api-services';

import { colors, urls } from '../../utilities/constants';
import { Message } from '../../components/common';
import * as store from '../../store';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const colorLayout = store.default.getState().auth.colorLayout;

const FaceDetectionComponent = ({
    captureImage,
    onFaceCapture,
    response,
    onFaceQueued,
    props
}) => {

    useEffect(() => {
        // setImages(false);
        return () => {
            setImages(false);
        }
    }, [])

    const [cameraData, setCameraData] = useState(null);
    const [images, setImages] = useState(false);
    const [isFaceCaptured, setFaceCapture] = useState(false);
    const [positionTop, setPositionTop] = useState(0);
    const [positionLeft, setPositionLeft] = useState(0);
    const [canDetectFaces, setDetectFaces] = useState(false);

    const [showMessage, setshowMessage] = useState(false);
    const [message, setMessage] = useState('');
    const [headerTitle, setheaderTitle] = useState('');

    const [closeType, setCloseType] = useState('')

    const fadeIn = {
        from: {
          opacity: 0,
        },
        to: {
          opacity: 1,
        },
      };

    const onFaceDetected = async ({faces}) => {
        if (faces[0]) {  
            
            var net = await NetInfo.fetch();

            if(net.isConnected && net.isInternetReachable){
                setPositionTop(faces[0].bounds.origin.x);
                setPositionLeft(faces[0].bounds.origin.y);
                
                if(!images){
                    setImages(true);
                    takePicture();
                }
            }else{
                if(!message){
                    setshowMessage(true);
                    setMessage('Internet connection is not available');
                    setheaderTitle('Alert');
                }
            }
            

        } 
        else {
            // this.setState({
            //     box: null,
            // });
        }
    };

    const takePicture = async () => {
        if (cameraData && !isFaceCaptured) {
            setFaceCapture(true);
            const options = { quality: 0.85, base64: true, fixOrientation: true, forceUpOrientation: true };
            const data = await (cameraData as any).takePictureAsync(options);
            RNFetchBlob.fs.unlink(data.uri);
            onFaceQueued(true);
            authenticateFace(data);
        }
    };

    const authenticateFace = (data: any) => {

        let headers = {
            secretKey: response.secretKey,
            udid: response.device_token
        };

        let postData = {
            loginId: 'data:image/jpeg;base64,'+data.base64,
            password: "",
            regcode: response.regcode
        }
        
        postService(urls.login, postData, headers).then((res: any) => {
            console.log(headers);
            console.log(postData);
            console.log(res)
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    setFaceCapture(false);
                    SendErrorLog('Screen => FaceDetectionComponent > Method => authenticateFace @ api => '+urls.login+' @ params => '+JSON.stringify(postData), 'Error While getting login');
                }
            }
            // setTimeout(() => {
                if(res.responseCode == 2000){
                    onFaceCapture(res);
                }else{
                    setImages(false);
                    // setFaceCapture(false);
                    onFaceQueued(false);
                    if(res.responseCode == 1010){
                        onFaceCapture(null);
                    }
                    setshowMessage(true);
                    setMessage('Authentication failed, please contact admin');
                    setheaderTitle('Alert');
                    setCloseType('login')
                }
            // }, 100);
        })
        .catch((err) => {
            console.log('exception')
            SendErrorLog('Screen => FaceDetectionComponent > Method => authenticateFace @ api => '+urls.login+' @ params => '+JSON.stringify(postData), err.message);
            setImages(false);
            setFaceCapture(false);
        })
    }

    return (
        <View
            style={{
                // flex: 1,
                height: 300,
                width: 300,
                overflow: 'hidden',
                borderRadius: 200,
                marginTop: 50,
                // backgroundColor: 'green'
            }}
        >

            <RNCameraImage
                ref={(ref: any) => {
                    setCameraData(ref);
                }}
                onCameraReady={() => {
                    setDetectFaces(true);
                }}
                style={styles.preview}
                captureAudio={false}
                playSoundOnCapture={false}
                type={RNCameraImage.Constants.Type.front}
                flashMode={RNCameraImage.Constants.FlashMode.off}
                onFacesDetected={canDetectFaces ? onFaceDetected as any : null}
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
                autoFocus={RNCamera.Constants.AutoFocus.on}
                
            />

            <Message 
                message={message} 
                visible={showMessage}
                onDismiss={() => {
                    if(closeType == 'login'){
                        setshowMessage(false);
                        // RNExitApp.exitApp();
                        setFaceCapture(false);
                        props['navigation'].navigate('Registration');
                    }else{
                        setshowMessage(false);
                    }
                }}
                position={'bottom'}
                colorLayout={colorLayout}
                headerTitle={headerTitle}
            ></Message>


        </View>
    );
}

const styles = StyleSheet.create({
    preview: {
        height: 300,
        width: 300,
        // overflow: 'hidden',
        // marginTop: 20,
        // borderRadius: 200,
        alignSelf: 'center'
    }
});

export { FaceDetectionComponent };
