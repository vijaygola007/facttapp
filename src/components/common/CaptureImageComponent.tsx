import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet, Modal, View, 
    Dimensions, Image, ScrollView, Platform, Keyboard
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';

import {RNCamera as RNCameraImage, TakePictureResponse, TakePictureOptions} from 'react-native-camera';
import { Icon, Input, Slider } from 'react-native-elements';
import RNFetchBlob from 'rn-fetch-blob';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import {
    Image as ImageCompress
} from "react-native-compressor";
import {requestMultiple, PERMISSIONS} from 'react-native-permissions';
// import PhotoEditor from 'react-native-photo-editor';

import * as store from '../../store';
import { AlertComponent } from './Alert';
import { Message } from './Message';
import { LoaderComponent } from './LoaderComponent';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;


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
// var RNFS = require('react-native-fs');
import RNFS from 'react-native-fs';

const CaptureImageComponent = ({
    visible,
    onClose,
    onSubmit,
    length,
    imagesSaved,
    flash = false,
    file,
    fileLength
}) => {

    const [cameraData, setCameraData] = useState(null);
    const [images, setImages] = useState(file);
    const [previewVisibility, setPreviewVisibility] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [showImageCapture, setImageCapture] = useState(true);
    const [showAllImages, setShowAllImages] = useState(false);

    const [zoom, setZoom] = useState(0);
    const [vertValue, setVertValue] = useState(100);

    const [isImagesSaved, setImagesSaved] = useState(false);

    const [openMessageModal, setMessageModal] = useState(false);
    const [openMessageModalText, setMessageModalText] = useState('');

    const [openModal, setModal] = useState(false);
    const [modalMessage, setMessage] = useState('');
    const [currentImage, setCurrentImage] = useState(null);
    const [alertFor, setAlertFor] = useState('');

    const [availableHeight, setAvailableHeight] = useState(screenHeight);
    const [showKeyboard, setshowKeyboard] = useState(false);

    const [cameraStatus, setCameraStatus] = useState('');
    const [useBackCamera, setUseBackCamera] = useState(true);
    const [showFlash, setFlash] = useState(flash);
    const [colorLayout, setColorLayout] = useState(store.default.getState().auth.colorLayout);

    const [refs, setRefs] = useState(null);
    
    const [videoRecordingButtonClicked, setVideoRecordingButtonClicked] = useState(false);
    const [currentCapturedImage, setCurrentCapturedImage] = useState('');

    const [show_loader, set_loader] = useState(false);
    const [image_comment_keyboard, set_image_comment_keyboard] = useState(false);
    const [compression_percentage, set_compression_percentage] = useState(0);

    const PATH = (Platform.OS == 'ios' ? RNFS.CachesDirectoryPath : RNFS.ExternalDirectoryPath)+'/VoucherEvidence/';

    useEffect(() => {
        if(cameraData){
            setRefs(cameraData);
        }
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setshowKeyboard(true);
            }
        );

        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setshowKeyboard(false);
            }
        );

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };

    }, []);

    const takePicture = async () => {
        if(images.length == length){
            setMessageModal(true);
            setMessageModalText(`Image capture limit reached`)
            return;
        }
        if (cameraData) {
            // const options = { quality: 1, base64: false,
            //     fixOrientation: true, mirrorImage: useBackCamera ? false : true, forceUpOrientation: true };
            const options: TakePictureOptions = { 
                quality: 0.5, 
                base64: false, 
                fixOrientation: true, 
                mirrorImage: useBackCamera ? false : true, 
                forceUpOrientation: true, 
                width: 500 
            };
            const data: TakePictureResponse = await (cameraData as any).takePictureAsync(options);
            
            saveImage(data);
        }
    };

    const saveImage = (data: any) => {
        const img = JSON.parse(JSON.stringify(images));
        var file_name = Date.now()+'.jpg';
        data.id = uuid.v4();
        data.capture_time = Date.now();
        data.name = file_name;
        data.type = 'image/jpeg';
        var file_path = PATH+file_name;
        // data.uri = file_path;
        // delete data.base64;

        // console.log(data.uri);
        // setCurrentCapturedImage(data.uri);
        // img.push(data);
        // setFlash(false);
        // setZoom(0);
        // setShowAllImages(false);

        RNFS.moveFile(data.uri, file_path)
        .then(() => {
            setCurrentCapturedImage('file://'+file_path as any);
            data.uri = file_path;
            delete data.base64;

            img.push(data);
            setFlash(false);
            setZoom(0);
            setImages(img);
            setImageCapture(false);
            setShowAllImages(false);
        }).catch((error) => {
            console.log(error);
        });
    }

    const removeImage = (img: object, index: number) => {
        const all_img = JSON.parse(JSON.stringify(images));
        
        const flt = all_img.filter((i: object) => i['id'] !== img['id']);
        setImages(flt);
        setImagesSaved(false);
        if(flt.length == 0){
            setShowAllImages(false);
            setImageCapture(true);
        }
    }

    const onRequestClose = () => {
        if(images.length == 0){
            onSubmit([], false);
        }
        else if(!showImageCapture && !showAllImages && images.length > 0){
            
            setAlertFor('remove_current_captured');
            setMessage('Are you sure to delete this image ?')
            setModal(true);
        }
        else if(images.length > 0 && !isImagesSaved && showImageCapture){
            setAlertFor('not_saved');
            setMessage('Are you sure to delete captured images ?')
            setModal(true);
        }
        else if(images.length > 0 && !showImageCapture && showAllImages){
            setShowAllImages(false);
            setImageCapture(true);
        }
        else {
            onSubmit(images, true, true);
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
        setImageCapture(true);
        setImagesSaved(imagesSaved);
        setshowKeyboard(false);
    }

    const ChangeZoom = (val: any) => {
        var z = (100 - val)/100;
        setZoom(z);
    };

    const saveCapturedImages = async () => {
        var filter = images.filter((img: any) => !img.is_compressed);
        if(filter.length == 0){
            sendCapturedImages(images);
        }else{
            if(filter.length > 0){
                set_loader(true);
                setTimeout(() => {
                    compressImages(0, filter, []);
                }, 10);
                
            }else{
                sendCapturedImages(images);
            }
        }
    }

    const compressImages = async (current_index: number, filtered_images: Array<object>, images_list: Array<object>) => {
        // images.forEach(async (img: any, img_index: number) => {
            if(current_index == filtered_images.length){
                var all_images = JSON.parse(JSON.stringify(images));
                all_images.forEach((i) => {
                    i.is_compressed = true;
                });
                setImages(all_images);
                setTimeout(() => {
                    sendCapturedImages(all_images);
                    set_loader(false);
                }, 100);
                // saveCapturedImages();
            }else{
                var img = JSON.parse(JSON.stringify(filtered_images[current_index]));
                var image = await ImageCompress.compress(img.uri, {compressionMethod: 'auto'});

                set_compression_percentage(100);

                setTimeout(() => {
                    var _compressed_file_path = Platform.OS == 'ios' ? '/var/'+image.split('/var/')[1] : image;

                    RNFS.moveFile(_compressed_file_path, img.uri)
                    .then(() => {
                        img.is_compressed = true;
                        images_list.push(img);
                        compressImages(current_index+1, filtered_images, images_list);
                    }).catch((error) => {
                        img.is_compressed = true;
                        images_list.push(img);
                        compressImages(current_index+1, filtered_images, images_list);
                    })

                    // RNFetchBlob.fs.readFile(_compressed_file_path, 'base64').then(async (base64) => {
                        
                    //     RNFetchBlob.fs.unlink(_compressed_file_path).then(async (compressed_evidence_res) => {
                    //         RNFetchBlob.fs.unlink(img.uri).then(() => {
                    //             RNFetchBlob.fs.createFile(img.uri, base64, 'base64')
                    //             .then((res) => {
                    //                 img.is_compressed = true;
                    //                 images_list.push(img);
                    //                 compressImages(current_index+1, filtered_images, images_list);
                    //             })
                    //             .catch((err) => {
                    //                 console.log('error 4');
                    //             })
                    //         }).catch((error) => {
                    //             console.log('error 3');
                    //         })
                
                    //     }).catch((error) => {
                    //         console.log('error 2');
                    //     })
                    // }).catch((error) => {
                    //     console.log(error);

                    //     console.log('error 1');
                    // })
                }, 100);

                
            }
            
        // })
    }

    const sendCapturedImages = (image_list) => {
        setFlash(false);
        setZoom(0);
        setShowAllImages(false);
        setImageCapture(true);
        onSubmit(image_list, true, true);
        setImagesSaved(true);
    }


    return (
        <Modal
            animationType='fade'
            transparent
            visible={visible}
            onRequestClose={() => {
                onRequestClose();
            }}
            onShow={() => {
                setImages(file);
                setShowAllImages(false);
                setImageCapture(true);
                setColorLayout(store.default.getState().auth.colorLayout);
                verifyPermission();
            }}
            style={{
                
            }}
            onLayout={(evt) => {
                
            }}
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
                    }}
                >
                    Capture Image
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

            <Wrapper
      
                containerStyle={{
                    paddingHorizontal: 0,
                    paddingTop: 4
                    // paddingBottom: 4
                }} 
                colorLayout={colorLayout}
                isModal={true}
                disableKeyboardBottom={true}
                scrollEnabled={true}
            >
            
                {
                    (cameraStatus == 'blocked' || cameraStatus == 'denied') &&
                    <Text style={{
                        paddingTop: (SCREEN_HEIGHT * 0.8)/2,
                        textAlign: 'center'
                    }}>FACTT cann't access camera</Text>
                }

                {
                    cameraStatus == 'granted' && showImageCapture && !showAllImages &&
                    <View
                        style={{
                            display: showImageCapture && !showAllImages ? 'flex' : 'none',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: VIEW_PART_HEIGHT(),
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
                            type={useBackCamera ? RNCameraImage.Constants.Type.back : RNCameraImage.Constants.Type.front}
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
                            zoom={zoom}
                        >
                        </RNCameraImage>
                        
                        <View>
                            <View
                                style={{
                                    width: SCREEN_WIDTH,
                                    flexDirection: 'row-reverse',
                                    paddingLeft: APP_PADDING,
                                    paddingTop: 75
                                }}
                            >
                                
                                <View>
                                    <TouchableOpacity 
                                        activeOpacity={0.9}
                                        style={{
                                            ...styles.flash_btn,
                                            backgroundColor: colorLayout.subHeaderBgColor
                                        }}
                                        onPress={() => {
                                            if(useBackCamera){
                                                setFlash(!showFlash);
                                            }
                                        }}
                                    >

                                        <Icon
                                            name={showFlash ? 'flash-on' : 'flash-off'}
                                            type='material'
                                            color={colorLayout.headerTextColor}
                                            containerStyle={{
                                                
                                            }}
                                            iconStyle={{
                                                fontSize: 24,
                                            }}
                                            
                                        />

                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{
                                            ...styles.flash_btn,
                                            backgroundColor: colorLayout.subHeaderBgColor,
                                            marginTop: 20
                                        }}
                                        onPress={() => {
                                            setFlash(false);
                                            setZoom(0);
                                            setUseBackCamera(!useBackCamera);
                                            setVertValue(99.9);
                                            setTimeout(() => {
                                                setVertValue(100);
                                            }, 0)
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Icon
                                            name={useBackCamera ? 'camera-rear' : 'camera-front'}
                                            type='ionicons'
                                            color={colorLayout.headerTextColor}
                                            containerStyle={{
                                                
                                            }}
                                            iconStyle={{
                                                fontSize: 24,
                                            }}
                                            
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View
                                style={{
                                    width: SCREEN_WIDTH,
                                    flexDirection: 'row-reverse',
                                    paddingLeft: APP_PADDING,
                                    height: 200,
                                    display: showImageCapture && !showAllImages ? 'flex' : 'none',
                                    marginTop: 75
                                }}
                            >
                                <Slider
                                    value={vertValue}
                                    onValueChange={ChangeZoom}
                                    allowTouchTrack={true}
                                    animateTransitions={true}
                                    onSlidingComplete={() => {
                                        
                                    }}
                                    onSlidingStart={(v) => {
                                        
                                    }}
                                    maximumValue={100}
                                    minimumValue={0}
                                    step={10}
                                    orientation="vertical"
                                    thumbStyle={{ height: 20, width: 16, backgroundColor: 'transparent' }}
                                    thumbProps={{
                                        children: (
                                            <Icon
                                                name="search-plus"
                                                type="font-awesome"
                                                size={20}
                                                reverse
                                                containerStyle={{ bottom: 20, right: 20 }}
                                                color={colorLayout.subHeaderBgColor}
                                                backgroundColor={colorLayout.subHeaderBgColor}
                                                
                                            />
                                        ),
                                    }}
                                />
                            </View>

                        </View>

                        <View style={{ 
                            // marginTop: screenHeight - getStatusBarHeight() - 80, 
                            width: SCREEN_WIDTH, 
                            display: showImageCapture && !showAllImages ? 'flex' : 'none',
                            padding: APP_PADDING
                            // zIndex: 10,
                            // position: 'absolute'
                        }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-around'
                                }}
                            >
                                {
                                    images.length > 0 &&
                                    <View>
                                        <TouchableOpacity 
                                            onPress={() => {
                                                setShowAllImages(true);
                                                setImageCapture(false);
                                            }} 
                                            style={{
                                                ...styles.capture_btn, 
                                                backgroundColor: colorLayout.subHeaderBgColor, 
                                                position: 'relative',
                                            }}
                                        >
                                        <Image
                                            resizeMode={"cover"}
                                            source={{uri: 'file://'+images[images.length - 1]['uri']}}
                                            style={{
                                                height: 60,
                                                width: 60,
                                                borderRadius: 50
                                            }}
                                        />
                                        </TouchableOpacity>

                                        <View
                                            style={{
                                                height: 24,
                                                width: 24,
                                                backgroundColor: colorLayout.headerBgColor,
                                                marginTop: 6,
                                                marginLeft: 40,
                                                borderRadius: 50,
                                                position: 'absolute',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    color: colorLayout.headerTextColor,
                                                    fontWeight: '600'
                                                }}
                                            >
                                                {images.length}
                                            </Text>
                                        </View>
                                    </View>
                                }
                    

                                <TouchableOpacity 
                                    onPress={() => {
                                        // if((images.length + fileLength) > length){
                                        //     setMessageModal(true);
                                        //     setMessageModalText(`Max ${length} image are allowed`)
                                        // }else{
                                            if(!videoRecordingButtonClicked){
                                                setVideoRecordingButtonClicked(true);
                                                setTimeout(() => {
                                                    setVideoRecordingButtonClicked(false); 
                                                }, 2000);
                                                takePicture();
                                            }
                                        // }
                                    }}
                                    style={{
                                        ...styles.capture_btn, 
                                        backgroundColor: colorLayout.subHeaderBgColor, 
                                    }}
                                >
                                    <Icon
                                        name='camera'
                                        type='font-awesome'
                                        color={colorLayout.headerTextColor}
                                        containerStyle={{
                                            
                                        }}
                                        iconStyle={{
                                            fontSize: 32,
                                        }}
                                        
                                    />
                                </TouchableOpacity>


                                {
                                    images.length > 0 &&
                                    <TouchableOpacity 
                                        onPress={() => {
                                            // sendCapturedImages(images);
                                            saveCapturedImages();
                                        }} 
                                        style={{
                                            ...styles.capture_btn, 
                                            backgroundColor: colorLayout.subHeaderBgColor, 
                                        }}
                                    >
                                        <Icon
                                            name='check'
                                            type='font-awesome'
                                            color={colorLayout.headerTextColor}
                                            containerStyle={{
                                                
                                            }}
                                            iconStyle={{
                                                fontSize: 34,
                                            }}
                                            
                                        />
                                    </TouchableOpacity>
                                }

                            </View>
                            <Text
                                style={{
                                    color: '#fff',
                                    textAlign: 'center',
                                    fontSize: TEXT_SIZE_12,
                                    fontWeight: '600'
                                }}
                            >
                                Click on camera icon to capture image
                            </Text>
                        </View>
                    

                    </View>
                }

                <View
                    style={{
                        display: showAllImages ? 'flex' : 'none',
                        width: screenWidth,
                        flex: 1,
                        paddingTop: 60,
                        justifyContent: 'space-between',
                        paddingBottom: 6
                    }}
                >
                    
                    <ScrollView
                        style={{
                            width: screenWidth,
                            paddingHorizontal: APP_PADDING,
                            backgroundColor: colorLayout.appBgColor,
                            paddingTop: (Platform.OS == 'ios' ? getStatusBarHeight() : 0),
                        }}
                        scrollEnabled={true}
                    >
                        {
                            images.map((a: any, index: number) => {
                                return (
                                    <View
                                        key={index}
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'flex-start',
                                            marginTop: 20,
                                            borderBottomWidth: images.length - 1 > index ? 1 : 0,
                                            paddingBottom: (Platform.OS == 'ios' && images.length == index + 1 ? getStatusBarHeight() + 10 : 8),
                                            borderBottomColor: '#d3d3d3'
                                        }}
                                    >

                                        <TouchableOpacity
                                            onPress={() => {
                                                setPreviewVisibility(true);
                                                setPreviewImage(a);
                                            }}
                                        >
                                            <Image
                                                resizeMode={"cover"}
                                                source={{uri: 'file://'+a.uri}}
                                                style={{
                                                    height: 120,
                                                    width: 120,
                                                    borderRadius: 8
                                                }}
                                            />
                                        </TouchableOpacity>
                                        

                                        <TouchableOpacity 
                                            activeOpacity={0.7}
                                            style={{
                                                position: 'absolute',
                                                backgroundColor: '#ff0000',
                                                padding: 5,
                                                borderRadius: 50,
                                                height: 27,
                                                width: 27,
                                                marginLeft: 100,
                                                marginTop: -12
                                            }}
                                            onPress={() => {
                                                setCurrentImage(a);
                                                setAlertFor('array');
                                                setMessage('Are you sure want to remove image ?')
                                                setModal(true);
                                            }}
                                        >
                                            <Icon
                                                name='trash-o'
                                                type='font-awesome'
                                                color={'#ffffff'}
                                                containerStyle={{
                                                    
                                                }}
                                                iconStyle={{
                                                    fontSize: 16,
                                                }}
                                                
                                            />
                                        </TouchableOpacity>
                                        
                                    </View>
                                )
                                
                            })
                        }
                    </ScrollView>

                    
                    <View
                        style={{
                            flexDirection: 'row',
                            paddingVertical: APP_PADDING,
                        }}
                    >
                        <TouchableOpacity 
                            onPress={() => {
                                setFlash(false);
                                setZoom(0);
                                setShowAllImages(false);
                                setImageCapture(true);
                            }} 
                            style={{
                                ...styles.action_btn
                            }}
                        >
                            <Text
                                style={{
                                    color: colorLayout.headerTextColor,
                                    fontWeight: '600',
                                    width: 130,
                                    textAlign: 'center',
                                    textAlignVertical: 'center',
                                }}
                            >
                                New Image
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => {
                                // sendCapturedImages(images);
                                saveCapturedImages();
                            }} 
                            style={{
                                ...styles.action_btn,
                                backgroundColor: colorLayout.subHeaderBgColor
                            }}
                        >
                            <Text
                                style={{
                                    color: colorLayout.headerTextColor,
                                    fontWeight: '600',
                                    letterSpacing: 0.8,
                                    width: 130,
                                    textAlign: 'center',
                                    textAlignVertical: 'center',
                                    fontSize: 16
                                }}
                            >
                                Done
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>

                {
                    images.length > 0 &&
                    <View
                        style={{
                            display: !showImageCapture && !showAllImages ? 'flex' : 'none',
                            alignItems: 'center',
                            backgroundColor: colorLayout.appBgColor,
                            height: VIEW_PART_HEIGHT(),
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            paddingTop: 60 + APP_PADDING,
                            paddingBottom: APP_PADDING,
                        }}
                    >
                        <View
                            style={{
                                height: (VIEW_PART_HEIGHT() * 0.75),
                                width: SCREEN_WIDTH - (2 * APP_PADDING),
                            }}
                        >
                            <Image
                                resizeMode={'stretch'}
                                source={{uri: currentCapturedImage as any}}
                                style={{
                                    height: (VIEW_PART_HEIGHT() * 0.75),
                                    width: SCREEN_WIDTH - (2 * APP_PADDING),
                                }}
                            />
                        </View>
                        

                        <View
                            style={{
                                flexDirection: 'row',
                                backgroundColor: colorLayout.appBgColor,
                                paddingHorizontal: APP_PADDING
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
                                    marginRight: APP_PADDING,
                                }}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    setFlash(false);
                                    setZoom(0);
                                    setAlertFor('single');
                                    setMessage('Are you sure to delete this image ?')
                                    setModal(true);
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
                                activeOpacity={0.7}
                                style={{
                                    backgroundColor: colorLayout.subHeaderBgColor,
                                    alignItems: 'center',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    paddingVertical: PADDING_14,
                                    borderRadius: BTN_BORDER_RADIUS,
                                    flex: 1,
                                    marginLeft: APP_PADDING
                                }}
                                onPress={() => {
                                    var img = JSON.parse(JSON.stringify(images));
                                    img[img.length - 1].showMore = false;
                                    setFlash(false);
                                    setZoom(0);
                                    Keyboard.dismiss();
                                    setImages(img);
                                    setImageCapture(true);
                                    setUseBackCamera(true);
                                    set_image_comment_keyboard(false);
                                }}
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
                }
                

                <Modal
                    animationType='slide'
                    transparent
                    visible={previewVisibility}
                    onRequestClose={() => {
                        setPreviewVisibility(false);
                    }}
                >
                <View 
                    style={{
                        flex: 1,
                        backgroundColor: '#fff',
                        zIndex: 1,
                        position: 'absolute',
                        height: availableHeight,
                        width: screenWidth,
                        opacity: 0.8
                    }}
                >
                    
                </View>

                <View style={{ ...styles.centeredView, alignItems: 'flex-end', height: availableHeight * 0.5, marginTop: availableHeight * 0.25 }}>
                    <TouchableOpacity
                        style={{
                            ...styles.modalActionBtn,
                            marginRight: 15,
                            zIndex: 10,
                            position: 'relative'
                        }}
                        onPress={() => {
                            setPreviewVisibility(false);
                        }}
                    >
                        <Icon
                            name='close'
                            type='font-awesome'
                            color='#000'
                            containerStyle={{
                                
                            }}
                            iconStyle={{
                                fontSize: 24,
                            }}
                            
                        />
                    </TouchableOpacity>
                    <View style={{...styles.modalView, backgroundColor: 'transparent'}}>

                        {
                            previewImage && 
                            <Image
                                resizeMode={"cover"}
                                source={{uri: 'file://'+previewImage['uri']}}
                                style={{height: availableHeight * 0.5 - 25, width: screenWidth}}
                            />
                        }
                        
                    </View>
                </View>
                </Modal>

                <LoaderComponent 
                    visible={show_loader}
                    headerTitle={'Image Compression'}
                    message={'Please wait...'} 
                    colorLayout={colorLayout}
                    percentage={compression_percentage}
                    secondary_message={'Image compression completed'}
                    show_percentage={false}
                    message_2={'Image compressing...'}
                ></LoaderComponent>
                {/* </View> */}

                <AlertComponent 
                    message={modalMessage} 
                    visible={openModal}
                    onCancel={() => {
                    setModal(false);
                    }}
                    onOk={() => {
                    setModal(false);
                    if(alertFor == 'single'){
                        RNFS.unlink(currentCapturedImage as any).then((res) => {
                            console.log('image deleted !!!'); 
                            RNFS.scanFile(PATH);   
                            RNFS.scanFile(currentCapturedImage as any);                      
                        }).catch((error) => {
                            console.log(error);
                        })
                        var img = JSON.parse(JSON.stringify(images));
                        img.splice(img.length - 1, 1);

                        setImages(img);
                        setImageCapture(true);
                    }
                    if(alertFor == 'array'){
                        RNFS.unlink((currentImage as any).uri).then((res) => {
                            console.log('Image Deleted!!!');
                            RNFS.scanFile(PATH);    
                            RNFS.scanFile((currentImage as any).uri);          
                        }).catch((error) => {
                            console.log(error);
                        })
                        removeImage((currentImage as any), (currentImage as any).index);
                    }
                    if(alertFor == 'not_saved'){
                        images.forEach((a: any) => {
                            RNFS.unlink(a.uri).then((res) => {
                                console.log('Image Deleted!!!');
                                RNFS.scanFile(PATH);    
                                RNFS.scanFile(a.uri);                           
                            }).catch((error) => {
                                console.log(error);
                            })
                        });
                        setImages([]);
                        onSubmit([], false);
                    }
                    if(alertFor == 'remove_current_captured'){
                        var img: any = JSON.parse(JSON.stringify(images));
                        RNFS.unlink(img[img.length - 1]['uri']).then((res) => {         
                            img.splice(img.length - 1, 1);
                            setImages(img);
                            setShowAllImages(false);
                            setImageCapture(true);  
                            RNFS.scanFile(PATH);  
                            RNFS.scanFile(img[img.length - 1]['uri']);               
                        }).catch((error) => {
                            
                        });
                    }

                    }}
                    headerTitle="Confirmation"
                    okText={'Yes'}
                    cancelText={'No'}
                ></AlertComponent>

                <Message 
                    message={openMessageModalText} 
                    backgroundColor={'#fff'} 
                    visible={openMessageModal}
                    duration={5000}
                    onDismiss={() => {
                    setMessageModal(false);
                    }}
                    position={'bottom'}
                    headerTitle="Alert"
                    colorLayout={colorLayout}
                ></Message>
            </Wrapper>

        </Modal>
            

    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        zIndex: 2, 
        position: 'absolute',
        width: screenWidth,
    },
    modalView: {
        backgroundColor: '#ffffff',
        padding: 0
    },
    modalActionBtn: {
        marginLeft: 40
    },
    preview: {
        justifyContent: 'flex-end',
        alignItems: 'center',
        overflow: 'hidden'
    },
    flash_btn: {
        borderRadius: 50,
        zIndex: 4,
        // marginTop: 75,
        height: 50,
        width: 50,
        alignItems: 'center',
        justifyContent: 'center'
    },
    capture_btn: {
        backgroundColor: '#062656',
        borderRadius: 50,
        marginVertical: APP_PADDING,
        height: 60,
        width: 60,
        flexDirection: 'row',
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

export { CaptureImageComponent };
