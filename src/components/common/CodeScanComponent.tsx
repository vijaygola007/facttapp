import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, Modal, View, Dimensions} from 'react-native';
import { moderateScale } from 'react-native-size-matters';

import {RNCamera as RNCameraImage} from 'react-native-camera';
import * as Animatable from 'react-native-animatable';

import * as store from '../../store';
import { Message } from './Message';


// wrappers
import { BTN_BORDER_RADIUS, CARD_BORDER_RADIUS } from '../../layout/wrapper';

const screenWidth = Dimensions.get('screen').width;
const screenHeight = Dimensions.get('screen').height;

const CodeScanComponent = ({
    visible,
    onClose,
    onSubmit
}) => {

    const [cameraData, setCameraData] = useState(null);
    const [isReadingBarcode, setBarcodeReading] = useState(false);
    const [colorLayout, setColorLayout] = useState(store.default.getState().auth.colorLayout)

    const [showMessage, setshowMessage] = useState(false);
    const [message, setMessage] = useState('');
    const [message_header, setMessage_header] = useState('')

    const fadeIn = {
        from: {
          opacity: 0,
        },
        to: {
          opacity: 1,
        },
    };

    return (
        <Modal
            animationType='slide'
            transparent
            visible={visible}
            onRequestClose={() => {
                onClose();
            }}
            onShow={() => {
                setColorLayout(store.default.getState().auth.colorLayout);
                setBarcodeReading(false);
            }}
            style={{
                flex: 1,
            }}
        >
            
        <View 
          style={{
            flex: 1,
            backgroundColor: '#131313',
            zIndex: 1,
            position: 'absolute',
            height: screenHeight,
            width: screenWidth,
            opacity: 0.6
          }}
        />



        <View style={{ ...styles.centeredView }}>

          <View style={styles.modalView}>
            
            <Text
                style={{
                  color: colorLayout.headerTextColor,
                  fontSize: 16,
                  backgroundColor: colorLayout.subHeaderBgColor,
                  paddingVertical: 10,
                  paddingLeft: 10,
                  borderRadius: 0,
                  marginBottom: 20,
                  marginLeft: -20,
                  marginTop: -20,
                  width: screenWidth * 0.9,
                  borderTopLeftRadius: 5,
                  borderTopRightRadius: 5
                }}
              >
                Scan QR Code
            </Text>

            <Text style={{...styles.modalInspectionNo,color: colorLayout.subTextColor, fontSize: 16, fontWeight: '600'}}>
                Scan site QR code to continue inspection
            </Text>

            <RNCameraImage
                ref={(ref: any) => {
                    setCameraData(ref);
                }}
                zoom={0}
                style={styles.preview}
                type={RNCameraImage.Constants.Type.back}
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
                
                onGoogleVisionBarcodesDetected={({ barcodes }) => {
                     
                    if(barcodes.length > 0){
                        if(!isReadingBarcode){

                            
                            if(barcodes[0]['data']){
                                var SiteCode: any = null;
                                
                                SiteCode = barcodes[0].data;

                                setBarcodeReading(true);
                                onSubmit(SiteCode);
                                     
                                
                            }
                    
                        }
                    }
                }}
            />


              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  marginTop: 20
                }}
              >

                <TouchableOpacity
                    style={{
                      ...styles.modalActionBtn,
                      backgroundColor: colorLayout.subHeaderBgColor,
                      

                    }}
                    onPress={() => {
                        onSubmit(null);
                    }}
                  >
                    <Text style={{...styles.openButton, color: colorLayout.headerTextColor, textAlignVertical: 'center'}}>Close</Text>
                  </TouchableOpacity>

              </View>
            </View>
          </View>

            <Message 
                message={message} 
                visible={showMessage}
                onDismiss={() => {
                    setshowMessage(false);
                    setBarcodeReading(false);
                }}
                position={'bottom'}
                headerTitle={message_header}
                colorLayout={colorLayout}
                animation={'fade'}
            ></Message>

        </Modal>
    );
}

const styles = StyleSheet.create({
    cameraContainer: {
        flexDirection: 'column',
        flex: 0,
    },
    centeredView: {
        flex: 1,
        zIndex: 2, 
        position: 'absolute',
        width: screenWidth,
        paddingTop: screenHeight * 0.2
    },
    modalView: {
        backgroundColor: '#ffffff',
        width: screenWidth * 0.9,
        padding: 20,
        alignSelf: 'center',
        borderRadius: CARD_BORDER_RADIUS
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#131313',
    },
    modalInspectionNo: {
        fontSize: 14,
        fontWeight: '400',
        color: '#131313',
        marginBottom: 20
    },
    modalActionBtn: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: BTN_BORDER_RADIUS,
        alignItems: 'center',
        marginHorizontal: 5
    },
    openButton: {
        fontWeight: '600',
        width: 100,
        textAlign: 'center'
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    preview: {
        height: screenWidth * 0.8,
        width: screenWidth * 0.8,
        overflow: 'hidden',
        alignSelf: 'center',
        borderRadius: CARD_BORDER_RADIUS
    },
    CommentContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        flex: 1
    },
    comment_box: {
        backgroundColor: '#ffffff',
    },
    capture_box:{ 
        flexDirection: 'column', 
        justifyContent: 'center',
        position: 'absolute',
        marginTop: screenHeight * 0.34,
        alignSelf: 'center'
    },
    absolute: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        height: 400,
        width: 400,
        backgroundColor: '#ff0000'
    }
});

export { CodeScanComponent };
