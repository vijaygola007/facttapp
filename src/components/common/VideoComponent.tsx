import React, { useState, useEffect, useRef } from 'react';
import { Text, TouchableOpacity, StyleSheet, Modal, View, Dimensions, Platform, StatusBar, AppState} from 'react-native';
import { moderateScale } from 'react-native-size-matters';

import {RNCamera as RNCameraImage, TakePictureResponse} from 'react-native-camera';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { Icon } from 'react-native-elements';
import { TextInput as TextInputPaper } from 'react-native-paper';
import Video from 'react-native-video';
import RNFetchBlob from 'rn-fetch-blob';

import {
    Video as VideoCompress,
} from "react-native-compressor";

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {request, requestMultiple, checkMultiple, PERMISSIONS} from 'react-native-permissions';

import * as store from '../../store';
import { hexToRgbA, MONTH_INDEX } from '../../utilities/constants';

import { AlertComponent } from  './Alert';
import { LoaderComponent } from './LoaderComponent';

// wrappers
import { Wrapper, PADDING_10, APP_PADDING, BORDER_RADIUS, CARD_BORDER_RADIUS,
    TEXT_SIZE_12, TEXT_SIZE_14, TEXT_SIZE_16, TEXT_SIZE_18, TEXT_SIZE_26, SCREEN_WIDTH, BODY_BOX_HEIGHT,
    PADDING_12,
    TEXT_SIZE_20,
    TEXT_SIZE_10,
    TEXT_SIZE_24,
    BTN_BORDER_RADIUS,
    PADDING_14,
    AVAILABLE_HEIGHT,
    SCREEN_HEIGHT,
    VIEW_PART_HEIGHT
} from '../../layout/wrapper';

import uuid from 'react-native-uuid';
import RNFS from 'react-native-fs';

const VideoComponent = ({
    intialValue,
    commentValue,
    currentIndexValue,
    visible,
    onClose,
    onSubmit,
    length,
    flash,
    videoStart,
    playvideo,
    videoRecording = null,
    paused = false,
    qCategoryID,
    sTypeId,
    inspectionId,
    siteID,
    questionID,
    recordedVideoLength,
    videoSaved,
    gpsCoordinate,
    trans_no,
    testme,
    testme_video_data,
    video_modal_state,
    set_video_modal_state
}) => {

    const [cameraData, setCameraData] = useState(null);
    const [canStopRecording, setStopRecording] = useState(false);
    const [images, setImages] = useState(intialValue);
    const [comment, setComment] = useState(commentValue);
    const [currentIndex, setIndex] = useState(currentIndexValue);
    const [showFlash, setFlash] = useState(flash);
    let   [timer, setTimer] = useState(0);
    const [videoTime, setVideoTime] = useState(videoStart);
    const [interval, setIntervalTime] = useState(null);
    const [videoPlay, setVideoPlay] = useState(playvideo);
    const [videoPaused, setVideoPaused] = useState(paused);

    const [recordedVideo, setRecordedVideo] = useState(videoRecording);

    const [audioLength, setAudioLength] = useState(0);

    const [isVideoSaved, setVideoSaved] = useState(false);
    const [isVideoDelted, setVideoDeleted] = useState(false);
    const [deleteWhileRecording, setDeleteWhileRecording] = useState(false);
    const [cameraStatus, setCameraStatus] = useState('');

    const [videoRef, setVideoRef] = useState(null);
    const [currentAudioTime, setCurrentAudioTime] = useState(0);

    const [colorLayout, setColorLayout] = useState(store.default.getState().auth.colorLayout);

    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const [warningMode, setWarningMode] = useState('');

    const [videoRecordingButtonClicked, setVideoRecordingButtonClicked] = useState(false);
    const [controls, showControls] = useState(false);
    const [currentProgressTime, setCurrentProgressTime] = useState(0);

    const [videoRecordingStarted, setVideoRecordingStarting] = useState(false);

    const [app_state, set_app_state] = useState('active');
    const appState = useRef(AppState.currentState);

    const [show_loader, set_loader] = useState(false);
    const [compression_percentage, set_compression_percentage] = useState(0);

    const [is_video_seeked, set_video_seeked] = useState(false);

    const PATH = (Platform.OS == 'ios' ? RNFS.CachesDirectoryPath : RNFS.ExternalDirectoryPath)+'/Evidences/';

    useEffect(() => {

        const subscription = AppState.addEventListener('change', nextAppState => {
            set_video_modal_state(nextAppState);
            if(nextAppState == 'background'){
                
                onSubmit([], 0, false);
                    
            }else{
                console.log('Foreground !!!');
            }

            appState.current = nextAppState;
            set_app_state(appState.current);
        });
        return () => {
            subscription.remove();
        };

    }, []);

    const takePicture = (canDelete: boolean = false) => {
        if(audioLength){
            setVideoRecordingStarting(false);
            stopTimer();
            setVideoPaused(true);
            setFlash(false);
        }else{
            setVideoRecordingStarting(true);
            setAudioLength(0);
            setVideoTime(getTimeDisplay(length));
            setVideoPlay(true);
            startTimer(canDelete);
            
            setVideoDeleted(false);
        }
    };

    const startTimer = async (test: boolean = false) => {

        if(!cameraData){
            return;
        }
        
        var current_time: number;

        var time_remainder: string;
        var t: number = 0;

        var tt: any = setInterval(function () {
            setTimer(timer => {

                current_time = timer - 1;
                time_remainder = getTimeDisplay(current_time);
                setVideoTime(time_remainder);
                return current_time;
            });


            t += 1;
            setAudioLength(t);

            if(current_time == 0 || current_time < 0){
                clearInterval(tt);
                stopTimer();
            }
            
        }, 1000);
        setIntervalTime(tt);

        const options = {
            quality: 0.8,
            videoBitrate: 800000,
            maxDuration: length,
            base64: false
        };

        var userData = store.default.getState().auth.userData;
        var dt = new Date(); var dt = new Date();
        var time = (dt.getUTCHours() > 9 ? dt.getUTCHours() : '0'+dt.getUTCHours())+''+(dt.getUTCMinutes() > 9 ? dt.getUTCMinutes() : '0'+dt.getUTCMinutes())+''+(dt.getUTCSeconds() > 9 ? dt.getUTCSeconds() : '0'+dt.getUTCSeconds());

        // var dynamic_file_name = `${path}${qCategoryID}_${sTypeId}_${inspectionId}_${siteID}_${questionID}_${data.id}_${data.capture_time}.mp4`;
        var dynamic_file_name = PATH+userData.loginId+'_'+trans_no+'_'+inspectionId+'_'+siteID+'_'+qCategoryID+'_'+questionID+'_'+gpsCoordinate+'_'+time+'.mp4';

        setStopRecording(true);
        
        const promise = await (cameraData as any).recordAsync(options);
        var data: any = {};
        data = promise; 
        data.id = uuid.v4();
        data.capture_time = Date.now();
        data.is_compressed = false;
        data.dynamic_file_name = dynamic_file_name;
        
        setRecordedVideo(data);

        var audio_file_path = data.uri;
        if(Platform.OS == 'ios'){
            audio_file_path = data.uri.split('file://')[1]
        }

        set_compression_percentage(0);
        set_loader(true);
        const compressedFileUrl = await VideoCompress.compress(promise.uri, {compressionMethod: 'auto', minimumFileSizeForCompress: 1}, (progress) => {
            var percentage: any = progress * 100;
            percentage = percentage.toFixed(2);
            if(percentage > 98){
                percentage = Math.round(percentage);
            }
            set_compression_percentage(percentage);
        });
        set_compression_percentage(100);
        
        setTimeout(()=>{
            RNFS.exists(dynamic_file_name).then((exists) => {
                if(exists){
                    RNFS.unlink(dynamic_file_name);
                }
                moveCompressedFile(data, dynamic_file_name, compressedFileUrl);
            }).catch((error) => {
                moveCompressedFile(data, dynamic_file_name, compressedFileUrl);
            })
        }, 100);
        
    }

    const moveCompressedFile = (data: any, dynamic_file_name: string, compressedFileUrl: string) => {
        RNFS.moveFile(data.uri, dynamic_file_name)
            .then(async () => {
                data.compressedFileUrl = compressedFileUrl;
                
                set_loader(false);
                setRecordedVideo(data);

                if(cameraData){
                    if((cameraData as any).deleteVideo){
                        deleteVideo(1);
                    }
                }
            }).catch((error) => {
                console.log('file move error');
                console.log(error);
                data.compressedFileUrl = compressedFileUrl;
                set_loader(false);
                setRecordedVideo(data);
            });
    }

    const getTimeDisplay = (current_time: number) => {
        var min: number;
        var hour: number;
        var remainder: number;
        var min_remainder: number;
        var time = '';
        if(current_time > 3600){

            min_remainder = current_time % 3600;
            hour = (current_time - min_remainder) / 3600;

            remainder = min_remainder % 60;
            min = (min_remainder - remainder) / 60;

            // setAudioTime(`${hour > 9 ? hour : '0'+hour}:${min > 9 ? min : '0'+min}:${remainder > 9 ? remainder : '0'+remainder}`);

            time = `${hour > 9 ? hour : '0'+hour}:${min > 9 ? min : '0'+min}:${remainder > 9 ? remainder : '0'+remainder}`;
        }
        else if(current_time <= 3600){
            remainder = current_time % 60;
            min = (current_time - remainder) / 60;

            time = `00:${min > 9 ? min : '0'+min}:${remainder > 9 ? remainder : '0'+remainder}`;
            // setAudioTime(`00:${min > 9 ? min : '0'+min}:${remainder > 9 ? remainder : '0'+remainder}`);
        }
        else{
            time = `00:00:${current_time > 9 ? current_time : '0'+current_time}`;
            // setAudioTime(`00:00:${current_time > 9 ? current_time : '0'+current_time}`);
        }
        return time;
    }

    const stopTimer = (play: boolean = true) => {
        setVideoPaused(play);
        setFlash(false);
        setVideoPlay(false);
        setVideoTime(getTimeDisplay(audioLength));
        if(interval){
            clearInterval(interval);
        }
        
        if(cameraData && canStopRecording){
            setStopRecording(false);
            (cameraData as any).stopRecording();
        }
    }

    const deleteVideo = async (len: number) => {
        setRecordedVideo(null);
        setVideoPaused(true);
        stopTimer();
        setAudioLength(0);
        setTimer(length);
        setVideoTime(getTimeDisplay(length));

        setVideoDeleted(true);
        setCurrentAudioTime(0);

        var cm: any = cameraData;
        cm.deleteVideo = false;
        setCameraData(cm);

        if(recordedVideo && len > 0){
            var keys = ['compressedFileUrl', 'dynamic_file_name', 'uri'];
            keys.forEach((key: string) => {
                if((recordedVideo as any)[key]){
                    RNFetchBlob.fs.exists((recordedVideo as any)[key])
                    .then(isExists => {
                        if(isExists){
                            RNFetchBlob.fs.unlink((recordedVideo as any)[key]);
                        }
                    });
                }
            });
        }
        
    }

    const onRequestClose = () => {
        if(audioLength == 0 || isVideoDelted){
            onSubmit([], 0, false);
        }
        else if(audioLength > 0 && recordedVideo && !isVideoSaved){
            setShowWarning(true);
            setWarningMessage('Are you sure want to remove recording ?');
            setWarningMode('delete');
        }
        else if(videoPlay){
            setShowWarning(true);
            setWarningMessage('Are you sure want to remove recording ?');
            setWarningMode('cancel'); 
        }
        else{
            onSubmit(recordedVideo, audioLength, true);
        }
    }

    const verifyPermission = () => {

        requestMultiple([PERMISSIONS.IOS.CAMERA, PERMISSIONS.ANDROID.CAMERA]).then((statuses) => {
            setCameraStatus(statuses[Platform.OS == 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA]);
            if(statuses[PERMISSIONS.IOS.CAMERA] == 'granted' || statuses[PERMISSIONS.ANDROID.CAMERA] == 'granted'){
                setVideoCamera();
            }
        });
  
    }

    const setVideoCamera = () => {
        setTimer(recordedVideoLength ? recordedVideoLength : length);
        setAudioLength(recordedVideoLength);
        setStopRecording(false);
        setVideoSaved(videoSaved);
        setDeleteWhileRecording(false);
        setVideoTime(getTimeDisplay(recordedVideoLength ? recordedVideoLength : length));
        if(recordedVideoLength > 0){
            setVideoPaused(false);
        }
        if(recordedVideoLength == 0){
            deleteVideo(recordedVideoLength);
        }
    }

    const submitVideo = async () => {
        if(videoPlay){
            takePicture(false);
            return;
        }
        
        if((recordedVideo as any).is_compressed){
            onSubmit(recordedVideo, audioLength, true);
        }else{

            set_loader(false);
            var video_detail = JSON.parse(JSON.stringify(recordedVideo));
            video_detail.is_compressed = true;
            video_detail.uri = video_detail.dynamic_file_name;
            setRecordedVideo(video_detail);
            onSubmit(video_detail, audioLength, true);

        }
    }

    return (
        <Modal
            animationType='slide'
            transparent
            visible={visible}
            onRequestClose={() => {
                onRequestClose()
            }}
            onShow={() => {

                set_loader(false);
                set_compression_percentage(0);
                setVideoRecordingStarting(false);
                setColorLayout(store.default.getState().auth.colorLayout);
                verifyPermission();

                setImages(intialValue);
                setVideoSaved(videoSaved);
                setTimer(recordedVideoLength ? recordedVideoLength : length);
                setAudioLength(recordedVideoLength);
                setRecordedVideo(intialValue);

                console.log('intialValue');
                console.log(intialValue);
                
                set_video_modal_state('');
            }}
            style={{
                
            }}
        >
            <Wrapper
      
                containerStyle={{
                    padding: 0,
                }} 
                colorLayout={colorLayout}
                isModal={true}
                disableKeyboardBottom={true}
                scrollEnabled={true}
            >

                <View
                    style={{
                        backgroundColor: colorLayout.headerBgColor,
                        zIndex: 4,
                        height: 60,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'absolute',
                        width: SCREEN_WIDTH
                    }}
                >
                    <Text
                        style={{
                            fontSize: 20,
                            paddingVertical: 15,
                            marginLeft: 10,
                            fontWeight: '600',
                            color: colorLayout.headerTextColor
                        }}
                    >
                        Video Recording
                    </Text>

                    <TouchableOpacity
                        style={{
                            marginRight: 10
                        }}
                        onPress={() => {
                            onRequestClose()
                        }}
                        activeOpacity={0.8}
                        >
                        <Icon
                            name='close'
                            type='ionicons'
                            color={colorLayout.headerTextColor}
                            iconStyle={{
                            fontSize: 30,
                            }}
                            
                        />
                    </TouchableOpacity>

                </View>

                {
                    (cameraStatus == 'blocked' || cameraStatus == 'denied') &&
                    <Text style={{
                        paddingTop: (VIEW_PART_HEIGHT() * 0.8)/2,
                        textAlign: 'center'
                    }}>FACTT cann't access camera</Text>
                }

                {
                    cameraStatus == 'granted' &&
                    <View
                        style={{
                            display: recordedVideo ? 'none' : 'flex',
                            marginTop: 0,
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: VIEW_PART_HEIGHT(),
                            overflow: 'hidden'
                        }}
                    >
                        
                        
                        <RNCameraImage
                            ref={(ref: any) => {
                                setCameraData(ref);
                            }}
                            style={{
                                width: SCREEN_WIDTH,
                                height: VIEW_PART_HEIGHT(),
                                position: 'absolute'
                            }}
                            type={RNCameraImage.Constants.Type.back}
                            flashMode={showFlash ? 'torch' : 'off'}
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
                            captureAudio={true}
                        />
                            
                        
                        <View
                            style={{
                                width: SCREEN_WIDTH,
                                flexDirection: 'row-reverse',
                                paddingLeft: APP_PADDING
                            }}
                        >
                            <TouchableOpacity 
                                activeOpacity={0.9}
                                style={{
                                    ...styles.flash_btn, 
                                    backgroundColor: colorLayout.subHeaderBgColor,
                                }}
                                onPress={() => {
                                    setFlash(!showFlash);
                                }}
                            >

                                <Icon
                                    name={showFlash ? 'flash-on' : 'flash-off'}
                                    type='material'
                                    color={colorLayout.headerTextColor}
                                    containerStyle={{
                                        
                                    }}
                                    iconStyle={{
                                        fontSize: TEXT_SIZE_24,
                                    }}
                                    
                                />

                            </TouchableOpacity>
                        </View>


                        <View 
                            style={{
                                ...styles.capture_box,
                                padding: APP_PADDING,
                            }}
                        >
                            <Text
                                style={{
                                    color: colorLayout.headerTextColor,
                                    textAlign: 'center',
                                    alignSelf: 'center',
                                    fontSize: TEXT_SIZE_16,
                                    letterSpacing: 0.3,
                                    width: SCREEN_WIDTH,
                                }}
                            >
                                {videoTime}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    if(!videoRecordingButtonClicked){
                                        setVideoRecordingButtonClicked(true);
                                        setTimeout(() => {
                                            setVideoRecordingButtonClicked(false); 
                                        }, 2000)
                                        takePicture();
                                    }
                                }} 
                                style={{
                                    ...styles.capture_btn, 
                                    backgroundColor:colorLayout.subHeaderBgColor
                                }}
                            >
                                <Icon
                                    name={audioLength ? 'stop' : 'video-camera'}
                                    type='font-awesome'
                                    color={colorLayout.headerTextColor}
                                    containerStyle={{
                                        
                                    }}
                                    iconStyle={{
                                        fontSize: 36,
                                    }}
                                     
                                />
                            </TouchableOpacity>
                            <Text
                                style={{
                                    color: colorLayout.headerTextColor,
                                    textAlign: 'center',
                                    alignSelf: 'center',
                                    fontSize: 13,
                                    fontWeight: '600'
                                }}
                            >
                                {`Click icon to ${audioLength ? 'stop' : 'start'} video recording`}
                            </Text>
                        </View> 
                    
                    </View>
                }


                <View
                    style={{
                        display: recordedVideo ? 'flex' : 'none',
                        alignItems: 'center',
                        backgroundColor: colorLayout.appBgColor,
                        height: VIEW_PART_HEIGHT(),
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        paddingTop: 60 + APP_PADDING,
                        paddingBottom: APP_PADDING,
                    }}
                >
                    {
                        recordedVideo && 
                        <Video
                            ref={(ref: any) => {
                                setVideoRef(ref);
                                if(ref){
                                    // ref._onPlaybackStalled(()=>{});
                                    // ref.props.paused = false;
                                    // console.log(ref.props.paused);
                                }
                            }}
                            style={{
                                width: SCREEN_WIDTH - (2 * APP_PADDING),
                                height: SCREEN_HEIGHT * 0.8 ,
                            }}
                            resizeMode={'cover'}
                            id="recorded_video_id"
                            source={{uri: 'file://'+recordedVideo['uri']}}
                            controls={true}
                            paused={videoPaused}
                            repeat={false}
                            onEnd={() => {
                                set_video_seeked(true);
                                setVideoPaused(true);
                                setCurrentAudioTime(0);
                                setCurrentProgressTime(0);
                                (videoRef as any).seek(0);
                            }}
                            onLoadStart={() => {
                                setVideoPaused(true);
                            }}
                            onLoad={() => {

                            }}
                            onProgress={(prog) => {
                                setCurrentProgressTime(prog.currentTime);
                            }}
                            onSeek={(seek) => {
                                
                            }}
                            onPlaybackStalled={(s) =>{
                                
                            }}
                            onPlaybackRateChange={(playbackRate) => {
                                
                            }}
                        />
                    }

                    <View
                        style={{
                            width: SCREEN_WIDTH,
                            flexDirection: 'row',
                            justifyContent: 'space-around',
                        }}
                    >
                        

                        <TouchableOpacity 
                            activeOpacity={0.7}
                            style={{
                                backgroundColor: '#ff0000',
                                alignItems: 'center',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                paddingVertical: PADDING_14,
                                borderRadius: BTN_BORDER_RADIUS,
                                flex: 1,
                                marginHorizontal: APP_PADDING
                            }}
                            onPress={() => {
                                setShowWarning(true);
                                setWarningMessage('Are you sure want to remove video ?');
                                setWarningMode('remove_video');
                            }}
                        >
                            <Text
                                style={{
                                    color: '#fff',
                                }}
                                numberOfLines={1}
                                ellipsizeMode={'clip'}
                            >
                                Delete
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            activeOpacity={0.7}
                            style={{
                                backgroundColor: colorLayout.subHeaderBgColor,
                                alignItems: 'center',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                paddingVertical: PADDING_14,
                                borderRadius: BTN_BORDER_RADIUS,
                                flex: 1,
                                marginHorizontal: APP_PADDING
                            }}
                            onPress={() => {
                                submitVideo();
                            }}
                        >

                            <Text
                                style={{
                                    color: colorLayout.headerTextColor,
                                }}
                                numberOfLines={1}
                                ellipsizeMode={'clip'}
                            >
                                Done
                            </Text>
                        </TouchableOpacity>
                    
                    </View>

                    {/* <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-around',
                            width: screenWidth,
                            alignItems: 'center',
                            backgroundColor: '#fff',
                        }}
                    >

                        

                    </View> */}

                </View>


                <LoaderComponent 
                    visible={show_loader}
                    headerTitle={'Video Compression'}
                    message={'Please wait...'} 
                    colorLayout={colorLayout}
                    percentage={compression_percentage}
                    secondary_message={'Video compression completed'}
                ></LoaderComponent>

                <AlertComponent 
                    message={warningMessage} 
                    visible={showWarning}
                    onCancel={() => {
                        setShowWarning(false);
                    }}
                    onOk={() => {
                        setShowWarning(false);

                        if(warningMode == 'delete'){
                            deleteVideo(1);
                            onSubmit([], 0, false);
                        }

                        if(warningMode == 'cancel'){
                            setDeleteWhileRecording(true);
                            var cm: any = cameraData;
                            cm.deleteVideo = true;
                            setCameraData(cm);
                            stopTimer();
                            setVideoPaused(false);
                            onSubmit([], 0, false);
                        }

                        if(warningMode == 'remove_video'){
                            deleteVideo(1);
                        }
                    }}
                    headerTitle="Confirmation"
                    okText={'Yes'}
                    cancelText={'No'}
                ></AlertComponent>

            </Wrapper>
            
        </Modal>
    );
}

const styles = StyleSheet.create({
    capture_btn: {
        backgroundColor: '#062656',
        borderRadius: 50,
        marginVertical: APP_PADDING,
        paddingHorizontal: APP_PADDING,
        alignSelf: 'center',
        height: 64,
        width: 64,
        alignItems: 'center',
        justifyContent: 'center'
    },
    flash_btn: {
        borderRadius: 50,
        zIndex: 4,
        marginTop: 75,
        height: 50,
        width: 50,
        alignItems: 'center',
        justifyContent: 'center'
    },
    capture_box:{ 
        flexDirection: 'column', 
        justifyContent: 'center',
        // position: 'absolute',
        alignSelf: 'center',
    }
});

export { VideoComponent };
