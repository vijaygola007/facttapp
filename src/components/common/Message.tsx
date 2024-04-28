import React, { useState } from 'react';
import { Text, StyleSheet, Modal, Dimensions, View, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';

import * as store from '../../store';
import { capitalizeFirstLetter } from '../../utilities/constants';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
// let colorLayout = store.default.getState().auth.colorLayout;

const Message = ({
    visible,
    message,
    backgroundColor = '',
    duration = 0 ,
    onDismiss,
    position = 'top',
    headerTitle = 'Message',
    showOk = true,
    OkText = 'Ok',
    colorLayout,
    animation = 'slide',
    showLoader = false
}) => {

    const [showModal, setVisible] = useState(true);
    // console.log(colorLayout)
    return (
      <Modal
        animationType={animation as any}
        transparent
        visible={visible}
        onRequestClose={() => {
          // this.setState({ visible: false });
        }}
        onShow={() => {
          setVisible(true);
          colorLayout = store.default.getState().auth.colorLayout;
        }}
      >
        <View 
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0, 0.6)',
            zIndex: 1,
            position: 'absolute',
            height: screenHeight,
            width: screenWidth,
            opacity: 0.6
          }}
        />

        <View style={{ ...styles.centeredView }}>
          <Card
            elevation={6}
            style={{
              borderRadius: 5,
              backgroundColor: '#ffffff',
              width: screenWidth * 0.9,
              padding: 0,
            }}
          >
            {/* <Card.Title 
              title={headerTitle} 
              titleStyle={{
                fontWeight: '600',
                color: colorLayout.headerBgColor,
                fontSize: 18,
                backgroundColor: 'red',
                
              }} 
            /> */}
            <Card.Content>

              <Text
                style={{
                  color: colorLayout.headerTextColor,
                  fontSize: 16,
                  backgroundColor: colorLayout.subHeaderBgColor,
                  paddingVertical: 10,
                  paddingLeft: 10,
                  borderRadius: 0,
                  marginBottom: 20,
                  marginLeft: -16,
                  marginTop: -16,
                  width: screenWidth * 0.9,
                  borderTopLeftRadius: 5,
                  borderTopRightRadius: 5
                }}
              >
                {headerTitle}
              </Text>

              {
                showLoader &&
                <View
                  style={{
                    marginBottom: 10,
                    backgroundColor: '#ffffff',
                    alignItems: 'center'
                  }}
                >
                  <Animatable.Image 
                    delay={50} 
                    duration={200} 
                    animation="zoomIn" 
                    iterationCount={'infinite'}
                    source={require('../../../assets/img/upload.png')} 
                    resizeMode='contain'
                    style={{height: 24, width: 24, tintColor: colorLayout.appTextColor}}
                    useNativeDriver
                  />
                </View>
              }
                
              <Text style={{ ...styles.modalMessage, color: colorLayout.subTextColor, textAlign: 'center'}}>{capitalizeFirstLetter(message)}</Text>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  
                }}
              >


                {
                  showOk && 
                  <TouchableOpacity
                    style={{
                      ...styles.modalActionBtn,
                      backgroundColor: colorLayout.subHeaderBgColor,
                      
                    }}
                    onPress={() => {
                      onDismiss();
                    }}
                  >
                    <Text style={{...styles.openButton, color: colorLayout.headerTextColor, textAlignVertical:'center'}}>{OkText}</Text>
                  </TouchableOpacity>
                }

              </View>
            </Card.Content>
          </Card>
          
        </View>
      </Modal>
    
    );
}

const styles = StyleSheet.create({

    centeredView: {
        borderWidth: 0,
        zIndex: 2, 
        position: 'absolute',
        alignSelf: 'center',
        marginTop: screenHeight * 0.35,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 5,
        },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 15,
        
    },
    openButton: {
      fontWeight: '600',
      width: 100,
      textAlign: 'center'
    },
    modalMessage: {
      fontSize: 16,
      fontWeight: '400',
      marginBottom: 20,
    },
    modalActionBtn: {
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderRadius: 4,
      alignItems: 'center',
      marginHorizontal: 5
    }
});

export { Message };
