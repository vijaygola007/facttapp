import React, { useState, useEffect, useRef } from 'react';
import { Text, TouchableOpacity, StyleSheet, Modal, View, 
    Platform, Image, AppState
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';

import AudioRecorderPlayer, {
    AVEncoderAudioQualityIOSType,
    AVEncodingOption,
    AudioEncoderAndroidType,
    AudioSourceAndroidType,
} from 'react-native-audio-recorder-player';

import { Icon } from 'react-native-elements';
import RNFetchBlob from 'rn-fetch-blob';
import Video from 'react-native-video';

import {requestMultiple, PERMISSIONS} from 'react-native-permissions';

import * as store from '../../store';

import RNFS from 'react-native-fs';
import { AlertComponent } from './Alert';


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

const audioRecordingPlayer = new AudioRecorderPlayer();

const AudioRecordComponent = ({
    intialValue,
    commentValue,
    currentIndexValue,
    visible,
    onClose,
    onSubmit,
    length,
    audioStart,
    audioRecording,
    playaudio,
    qCategoryID,
    sTypeId,
    inspectionId,
    siteID,
    questionID,
    recordedAudioLength,
    recordingSaved,
    gpsCoordinate,
    trans_no
}) => {

    const [interval, setIntervalTime] = useState(null);
    const [timer, setTimer] = useState(length);
    const [audioTime, setAudioTime] = useState(audioStart);
    // const [audioRecorderPlayer, setAudioRecorderPlayer] = useState(audioRecording);
    const [audioOptions, setAudioOptions] = useState(null);

    const [getAudio, setAudio] = useState(null);
    const [recordingStart, setRecordingStart] = useState(false);
    const [isAudioRecorded, setIsAudioRecorded] = useState(false);
    const [recordingCompleted, setRecordingCompleted] = useState(false);
    const [audioLength, setAudioLength] = useState(0);
    const [timerRemainder, setTimerRemainder] = useState(0);
    const [isRecordingSaved, setRecordingSaved] = useState(false);
    const [isAudioDeleted, setAudioDeleted] = useState(false);

    const [audioPermission, setAudioPermission] = useState('');

    const [videoRef, setVideoRef] = useState(null);
    const [isVideoPaused, setIsVideoPaused] = useState(true);

    const [currentAudioTime, setCurrentAudioTime] = useState(0);
    const [currentSeekTime, setCurrentSeekTime] = useState(0);
    const [colorLayout, setColorLayout] = useState(store.default.getState().auth.colorLayout);

    const [show_alert, set_show_alert] = useState(false);
    const [alert_mode, set_alert_mode] = useState('');
    const [alert_message, set_alert_message] = useState('');
    const [alert_title, set_alert_title] = useState('');
    const [alert_cancel_text, set_alert_cancel_text] = useState('');
    const [alert_ok_text, set_alert_ok_text] = useState('');

    const [app_state, set_app_state] = useState('active');
    const appState = useRef(AppState.currentState);

    const PATH = (Platform.OS == 'ios' ? RNFS.CachesDirectoryPath : RNFS.ExternalDirectoryPath)+'/Evidences/';

    useEffect(() => {

        const subscription = AppState.addEventListener('change', async nextAppState => {
            if(nextAppState == 'background'){
                const result = await audioRecordingPlayer.stopRecorder();
                audioRecordingPlayer.removeRecordBackListener();
                RNFetchBlob.fs.unlink(result).then(res => {
                    console.log('Audio Deleted !!!')
                });
                onSubmit([], 0, false);
                
            }else{
                console.log('Foreground !!!');
            }

            appState.current = nextAppState;
            set_app_state(appState.current);
        });
        // set_app_state(appState.current);
        return () => {
            subscription.remove();
        };

    }, []);

    const manageAudioRecording = async (closeModal: boolean) => {
        if(getAudio){
            stopTimer(closeModal);
        }else{
            setAudioLength(0);
            setCurrentAudioTime(0);
            setRecordingStart(true);
            setIsVideoPaused(true);
            setIsAudioRecorded(false);
            setAudioTime(getTimeDisplay(length));
            startTimer(length, true);
            onStartRecord();
        }
    };

    const startTimer = async (limit: number, bool: boolean) => {
        
        var current_time: number;
        var time_remainder: string;
        var t: number = 0;
        var tt: any = setInterval(function () {
            setTimer((timer: number) => {
                current_time = timer - 1;

                time_remainder = getTimeDisplay(current_time)
                setAudioTime(time_remainder);
                t += 1;
                setTimerRemainder(t);
                
                return current_time;
            });
            if(current_time == 0){
                clearInterval(tt);
                if(bool){
                    stopTimerWhenLengthLimitEnds(false);
                }
            }
            if(current_time < 0){
                clearInterval(tt);
                stopTimer(false);
            }

        }, 1000);
        setIntervalTime(tt);
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

    const stopTimer = (closeModal: boolean) => {
        // setTimeout(() => {
        //     setAudioPaused(true);
        // }, 0);
        // setTimer(0);
        if(audioLength == 0){
            setAudioLength(length - timer);
            setAudioTime(getTimeDisplay(length - timer));
        }
        // setTimer(length - timer);
        // setAudioTime(getTimeDisplay(length));
        // setAudioTime('00:00:00');
        setCurrentAudioTime(0);
        setIsAudioRecorded(true);
        clearInterval(interval as any);
        onStopRecord(closeModal);
    };

    const stopTimerWhenLengthLimitEnds = (closeModal: boolean) => {
        setAudioLength(length);
        setIsAudioRecorded(true);
        clearInterval(interval as any);
        onStopRecord(closeModal);
    }

    const onStartRecord = async () => {
        var dt = new Date();
        var userData = store.default.getState().auth.userData; var dt = new Date();
        var time = (dt.getUTCHours() > 9 ? dt.getUTCHours() : '0'+dt.getUTCHours())+''+(dt.getUTCMinutes() > 9 ? dt.getUTCMinutes() : '0'+dt.getUTCMinutes())+''+(dt.getUTCSeconds() > 9 ? dt.getUTCSeconds() : '0'+dt.getUTCSeconds());

        var dynamic_file_name = userData.loginId+'_'+trans_no+'_'+inspectionId+'_'+siteID+'_'+qCategoryID+'_'+questionID+'_'+gpsCoordinate+'_'+time+`${Platform.OS == 'ios' ? '.m4a' : '.mp3'}`;
        
        const path = Platform.select({
            ios: `${dynamic_file_name}`,
            android: `${PATH}${dynamic_file_name}`,
        });
        const audioSet = {
            AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
            AudioSourceAndroid: AudioSourceAndroidType.MIC,
            AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
            AVNumberOfChannelsKeyIOS: 2,
            AVFormatIDKeyIOS: AVEncodingOption.aac,
        };

        const result = await audioRecordingPlayer.startRecorder(path, audioSet);

        setAudio(result as any);
        audioRecordingPlayer.addRecordBackListener((e: any) => {
          return;
        });
    };
      
    const onStopRecord = async (closeModal: boolean) => {
        // if(audioLength > 0){
            const result = await audioRecordingPlayer.stopRecorder();
            audioRecordingPlayer.removeRecordBackListener();
            setAudioOptions({
                recordSecs: 0,
            } as any);
        // }
        // setAudio(result);

        if(Platform.OS == 'ios'){
            var audio_file_path = result.replace('file://', '');
            RNFetchBlob.fs.readFile(audio_file_path, 'base64')
            .then(base64 => {

                RNFetchBlob.fs.stat(audio_file_path)
                .then((stat) => {
                    RNFetchBlob.fs.unlink(audio_file_path).then(res => {
                    
                        var mp3_path = `${PATH}${stat.filename.replace('.m4a', '.mp3')}`;
                        RNFetchBlob.fs.createFile(mp3_path, base64, 'base64')
                        .then(() => {
                            setAudio(mp3_path as any);
                        })
                        .catch((err) => {
                            
                        })
                    }).catch((err2) => {
                        
                    })
                }).catch((err) => {

                })
                
            }).catch((errrrr) => {
                console.log(errrrr);
            })
        }

        setRecordingCompleted(true);
        setIsVideoPaused(true);
    };
      
    const onStartPlay = async () => {
        const msg = await audioRecordingPlayer.startPlayer();
        audioRecordingPlayer.addPlayBackListener((e) => {
            setAudioOptions({
                currentPositionSec: e.currentPosition,
                currentDurationSec: e.duration,
                playTime: audioRecordingPlayer.mmssss(Math.floor(e.currentPosition)),
                duration: audioRecordingPlayer.mmssss(Math.floor(e.duration)),
            } as any);
            return;
        });
      };
      
    const onPausePlay = async () => {
        await audioRecordingPlayer.pausePlayer();
    };
      
    const onStopPlay = async () => {
        audioRecordingPlayer.stopPlayer();
        audioRecordingPlayer.removePlayBackListener();
    };

    const playRecordedAudio = () => {
        
        // clearInterval(interval as any);
        // if(timer > 0){
        //     setTimer(audioLength - (audioLength - timer));
        // }else{
        //     setTimer(audioLength);
        // }
        setIsVideoPaused(false);
        setRecordingStart(true);


        var current_time: number = audioLength - currentSeekTime;
        
        var time_remainder: string;
        var t: number = currentSeekTime;
        var tt: any = setInterval(function () {
            current_time = current_time - 1;
            time_remainder = getTimeDisplay(current_time);
            setAudioTime(time_remainder);

            // t  = t + 1;
            setCurrentSeekTime(currentSeekTime + 1);
            
            if(current_time < 0 || current_time == 0){
                clearInterval(tt);
                setAudioTime(getTimeDisplay(audioLength));
                setCurrentSeekTime(0);
                setCurrentAudioTime(0);
            }
        }, 1000);
        setIntervalTime(tt);

        // startTimer(timer, true);
        // setAudioTime(getTimeDisplay(audioLength - timer));
    }

    const stopPlayingAudio = () => {
        // setAudioPlay(false);
        // setIsAudioRecorded(false);
        // setTimer(audioLength - timer);
        setRecordingStart(false);
        setIsVideoPaused(true);
        // setAudioTime(getTimeDisplay(timer));
        clearInterval(interval as any);
        setIntervalTime(null);
    }

    const deletePlayingAudio = (len: number) => {
        // setTimer(0);
        // setAudioTime('00:00:00');
        setTimer(length);
        setAudioTime(getTimeDisplay(length));
        
        setRecordingSaved(false);
        setAudioDeleted(true);

        setIsAudioRecorded(false);
        clearInterval(interval as any);
        setRecordingStart(false);
        setIsVideoPaused(true);
        setRecordingCompleted(false);
        setAudioLength(0);
        if(getAudio && len > 0){
            RNFetchBlob.fs.unlink(getAudio).then(res => {
                setAudio(null);
                console.log('Audio Deleted !!!')
            });
        }else{
            setAudio(null);
        }
        
    }

    const onRequestClose = () => {
        if(!getAudio){
            deletePlayingAudio(1);
            onSubmit([], 0), false;
        }
        else if(recordingStart){
            set_show_alert(true);
            set_alert_mode('cancel_recording');
            set_alert_cancel_text('No');
            set_alert_ok_text('Yes');
            set_alert_message('Are you sure want to cancel recording ?');
            set_alert_title('Confirmation');
        }
        else if(isRecordingSaved){
                onSubmit([{
                path: getAudio
            }], audioLength, true);
        }
        else if(isAudioDeleted){
            onSubmit([], 0, false);
        }
        else{
            set_show_alert(true);
            set_alert_mode('remove_recording');
            set_alert_cancel_text('No');
            set_alert_ok_text('Yes');
            set_alert_message('Are you sure want to remove current recording ?');
            set_alert_title('Confirmation');
        }
    }
    
    const verifyPermission = () => {
        
        requestMultiple([PERMISSIONS.IOS.MICROPHONE, PERMISSIONS.ANDROID.RECORD_AUDIO]).then((statuses) => {
            setAudioPermission(statuses[Platform.OS == 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO]);
            if(statuses[PERMISSIONS.IOS.MICROPHONE] == 'granted' || statuses[PERMISSIONS.ANDROID.RECORD_AUDIO] == 'granted'){
                setAudioRecorder();
            }
        });
    }

    const setAudioRecorder = () => {
        // setAudioRecorderPlayer(new AudioRecorderPlayer());
        setRecordingSaved(recordingSaved)
        if(recordedAudioLength == 0){
            deletePlayingAudio(0);
        }else{
            setTimer(recordedAudioLength ? recordedAudioLength : length);
            setAudioLength(recordedAudioLength);
            setAudioTime(getTimeDisplay(recordedAudioLength ? recordedAudioLength : length));
        }
    }

    return (
        <Modal
            animationType='slide'
            transparent
            visible={visible}
            onRequestClose={() => {
                onRequestClose();
            }}
            onShow={() => {
                setColorLayout(store.default.getState().auth.colorLayout);
                verifyPermission();

                if(intialValue){
                    if(intialValue.length > 0){
                        setAudio(intialValue[0]['path']);
                        setAudioLength(recordedAudioLength);
                        setRecordingCompleted(true);
                        setIsAudioRecorded(true);
                    }
                }
                
            }}
            style={{
                // flex: 1
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
                                marginLeft: 10,
                                fontWeight: '600',
                                color: colorLayout.headerTextColor,
                                textAlignVertical: 'center'
                            }}
                        >
                            Audio Recording
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
                        (audioPermission == 'blocked' || audioPermission == 'denied') &&
                        <Text style={{
                            paddingTop: (VIEW_PART_HEIGHT() * 0.8)/2,
                            textAlign: 'center'
                        }}>FACTT cann't access microphone</Text>
                    }

                    {
                        audioPermission == 'granted' && 
                        <View
                            style={{
                                height: VIEW_PART_HEIGHT(),
                                backgroundColor: colorLayout.appBgColor,
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}
                        >

                            <View
                                style={{
                                    alignItems: 'center',
                                    flex: 1,
                                    justifyContent: 'center'
                                }}
                            >
                                {
                                    (!isVideoPaused && recordingStart) && isAudioRecorded &&
                                    <Image 
                                        source={require(`../../../assets/img/audio.gif`)}  
                                        style={{height:100, width: SCREEN_WIDTH * 0.9 }} 
                                    />
                                }
                                {
                                    recordingStart && !isAudioRecorded &&
                                    <Image 
                                        source={require(`../../../assets/img/audio.gif`)}  
                                        style={{height:100, width: SCREEN_WIDTH * 0.9 }} 
                                    />
                                }
                                {
                                    isVideoPaused && recordingStart && isAudioRecorded &&
                                    <Image 
                                        source={require(`../../../assets/img/audio_pause.png`)}  
                                        style={{height:100, width: SCREEN_WIDTH * 0.9 }} 
                                    />
                                }
                                {
                                    (!recordingStart && isVideoPaused) &&
                                    <Image 
                                        source={require(`../../../assets/img/audio_pause.png`)}  
                                        style={{height:100, width: SCREEN_WIDTH * 0.9 }} 
                                    />
                                }
                            </View>
                    
                    

                        
                            <View style={{
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                width: SCREEN_WIDTH,
                                paddingBottom: APP_PADDING
                            }}>
                                <Text
                                    style={{
                                        color: colorLayout.appTextColor,
                                        textAlign: 'center',
                                        alignSelf: 'center',
                                        fontSize: moderateScale(16),
                                        letterSpacing: 0.3,
                                        width: SCREEN_WIDTH,
                                        fontWeight: '600'
                                    }}
                                >
                                    {/* {(recordingStart || recordingCompleted) ? audioTime : ''} */}
                                    {(recordingStart || recordingCompleted) ? audioTime : ''}
                                </Text>
                                
                                <View
                                    style={{
                                        display: isAudioRecorded ? 'none' : 'flex',

                                    }}
                                >
                                    <TouchableOpacity 
                                        onPress={() => {
                                            manageAudioRecording(false);
                                        }} 
                                        style={{...styles.capture_btn, backgroundColor:colorLayout.subHeaderBgColor}}
                                    >
                                        <Icon
                                            name={getAudio ? 'stop' : 'microphone'}
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
                                            color: colorLayout.appTextColor,
                                            textAlign: 'center',
                                            alignSelf: 'center',
                                            fontSize: TEXT_SIZE_12,
                                            fontWeight: '600'
                                        }}
                                    >
                                        {`${getAudio ? 'Click on icon to stop voice recording' : 'Click on mic icon to start voice recording'}`}
                                    </Text>
                                </View>

                                <View style={{
                                    display: isAudioRecorded ? 'flex' : 'none',
                                }}>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'center',
                                        }}
                                    >
                                    <TouchableOpacity 
                                        onPress={() => {
                                            stopPlayingAudio();
                                        }} 
                                        style={{
                                            ...styles.capture_btn, 
                                            backgroundColor:colorLayout.subHeaderBgColor,
                                            display: !isVideoPaused ? 'flex' : 'none'
                                        }}
                                    >
                                        <Icon
                                            name={'pause'}
                                            type='font-awesome'
                                            color={colorLayout.headerTextColor}
                                            containerStyle={{
                                                
                                            }}
                                            iconStyle={{
                                                fontSize: 36,
                                            }}
                                             
                                        />
                                    </TouchableOpacity>

                                    

                                    <TouchableOpacity 
                                        onPress={() => {
                                            playRecordedAudio();
                                        }} 
                                        style={{
                                            ...styles.capture_btn, 
                                            backgroundColor:colorLayout.subHeaderBgColor,
                                            display: isVideoPaused ? 'flex' : 'none',
                                        }}
                                    >
                                        <Icon
                                            name={'play'}
                                            type='font-awesome'
                                            color={colorLayout.headerTextColor}
                                            containerStyle={{
                                                marginLeft: 10
                                            }}
                                            iconStyle={{
                                                fontSize: 36,
                                            }}
                                        />
                                    </TouchableOpacity>


                                    
                                    </View>

                                </View>

                                <View
                                    style={{
                                        display: isAudioRecorded ? 'flex' : 'none',
                                        opacity: getAudio ? 1 : 0.6,
                                        flexDirection: 'row',
                                    }}
                                >
                                        <TouchableOpacity 
                                            onPress={() => {
                                                set_show_alert(true);
                                                set_alert_mode('remove_audio');
                                                set_alert_cancel_text('No');
                                                set_alert_ok_text('Yes');
                                                set_alert_message('Are you sure want to remove audio ?');
                                                set_alert_title('Confirmation');
                                            }} 
                                            style={{
                                                ...styles.action_btn,
                                                backgroundColor: '#ff0000',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: '#fff'
                                                }}
                                                numberOfLines={1}
                                                ellipsizeMode={'clip'}
                                            >
                                                Delete
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={{
                                                ...styles.action_btn,
                                                backgroundColor: colorLayout.subHeaderBgColor,
                                            }}
                                            onPress={() => {
                                                if(getAudio && recordingCompleted){
                                                    
                                                    onSubmit([{
                                                        path: getAudio
                                                    }], audioLength, true);

                                                }else{
                                                    manageAudioRecording(true);
                                                }
                                            }}
                                            disabled={!getAudio}
                                        >
                                            <Text
                                                style={{
                                                    color: colorLayout.headerTextColor
                                                }}
                                            >
                                                Done
                                            </Text>
                                        </TouchableOpacity>


                                </View>
                            </View>

                        </View>

                    }
                    
                    {
                        recordingCompleted && getAudio && !isVideoPaused &&
                        <Video 
                            ref={(ref: any) => {
                                setVideoRef(ref);
                            }}
                            source={{uri: getAudio}}
                            resizeMode={'cover'}
                            paused={isVideoPaused}
                            repeat={Platform.OS == 'ios' ? true : false}
                            onEnd={() => {
                                setIsVideoPaused(true);
                                setRecordingStart(false);
                                clearInterval(interval as any);
                                setCurrentSeekTime(0);
                                setCurrentAudioTime(0);
                                setAudioTime(getTimeDisplay(audioLength));
                            }}
                            onLoad={(ld) => {
                                // console.log(videoRef);
                                // if(currentAudioTime > 0){
                                    (videoRef as any).seek(parseFloat(currentAudioTime as any));
                                // }
                                // ld.currentTime = 2;
                                // setRecordingStart(true);
                                // clearInterval(interval as any);
                                // setTimer(length - timer);
                                // startTimer(timer, true);
                            }}
                            onSeek={(seek) => {
                                console.log(seek);
                            }}
                            onProgress={(prog) => {
                                // console.log(prog);
                                if(prog.currentTime > currentAudioTime){
                                    setCurrentAudioTime(prog.currentTime);
                                }
                            }}
                            audioOnly={true}
                        />
                    }
            {/* </View> */}

            

            <AlertComponent 
                message={alert_message} 
                visible={show_alert}
                onCancel={() => {
                    set_show_alert(false);
                }}
                onOk={() => {
                    set_show_alert(false);
                    if(alert_mode == 'cancel_recording'){
                        manageAudioRecording(false);
                        deletePlayingAudio(1);
                        onSubmit([], 0, false);
                    }
                    if(alert_mode == 'remove_recording'){
                        deletePlayingAudio(1);
                        onSubmit([], 0), false;
                    }
                    if(alert_mode == 'remove_audio'){
                        deletePlayingAudio(1);
                    }
                }}
                headerTitle={alert_title}
                okText={alert_ok_text}
                cancelText={alert_cancel_text}
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
        alignSelf: 'center',
        width: 64,
        height: 64,
        justifyContent: 'center',
        alignItems: 'center'
    },
    action_btn:{
        backgroundColor: '#ff0000',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        flex: 1,
        paddingVertical: PADDING_14,
        borderRadius: BTN_BORDER_RADIUS,
        marginHorizontal: APP_PADDING
    }
});

export { AudioRecordComponent };
