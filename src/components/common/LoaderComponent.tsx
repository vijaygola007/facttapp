import React, { useState } from 'react';
import { Text, StyleSheet, Modal, Dimensions, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card } from 'react-native-paper';
import { Icon } from 'react-native-elements';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
// let colorLayout = store.default.getState().auth.colorLayout;

const LoaderComponent = ({
    visible,
    message,
    headerTitle = 'Message',
    colorLayout,
    animation = 'fade',
    percentage = 0,
    secondary_message = '',
    show_percentage = true,
    message_2 = ''
}) => {

    const [showModal, setVisible] = useState(true);
    
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
            <Card.Content>
            <Text
                style={{
                  color: colorLayout.headerTextColor,
                  fontSize: 18,
                  backgroundColor: colorLayout.subHeaderBgColor,
                  paddingVertical: 10,
                  paddingLeft: 10,
                  borderRadius: 0,
                  marginBottom: 10,
                  marginLeft: -16,
                  marginTop: -16,
                  width: screenWidth * 0.9,
                  borderTopLeftRadius: 5,
                  borderTopRightRadius: 5
                }}
              >
                {headerTitle}
              </Text>

              <View
                style={{
                  marginBottom: 10,
                  backgroundColor: '#ffffff',
                  alignItems: 'center',
                  display: percentage < 100 ? 'flex' : 'none'
                }}
              >
                <ActivityIndicator 
                  style={{
                    opacity: 1,
                  }}
                  size={26}
                  color={colorLayout['subHeaderBgColor']}
                />
              </View>
              
              <Text 
                style={{ 
                  ...styles.modalMessage, color: colorLayout.subTextColor,
                  display: percentage < 100 ? 'flex' : 'none',
                  textAlign: 'center'
                }}
              >
                {message}
              </Text>

              {
                show_percentage &&
                <View
                  style={{
                    backgroundColor: '#ffffff',
                    alignItems: 'center',
                    display: percentage < 100 ? 'flex' : 'none'
                  }}
                >
                  <Text style={{ ...styles.modalMessage, color: colorLayout.subTextColor}}>
                    (<Text style={{fontSize: 12, fontWeight: '900'}}>{percentage.toString()} %</Text>) compression completed
                  </Text>
                </View>
              }
              

              

              <View
                style={{
                  display: percentage == 100 ? 'flex' : 'none',
                  alignItems: 'center'
                }}
              >
                <Icon
                  name='checkmark-circle'
                  type='ionicon'
                  color="#228B22"
                  containerStyle={{
                    alignSelf: 'center',
                    marginBottom: 10
                  }}
                  iconStyle={{
                    fontSize: 24,
                  }}
                  
                /> 
                <Text style={{ ...styles.modalMessage, color: colorLayout.subTextColor}}>{secondary_message}</Text>
              </View>

            </Card.Content>
          </Card>
          
        </View>
      </Modal>
    );
}

const styles = StyleSheet.create({
  message: {
      fontSize: 16
  },
  centeredView: {
      // flex: 1,
      // justifyContent: 'center',
      // alignItems: 'center',
      // marginTop: 22,
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
  historyView: {
      // margin: 20,
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 10,
      paddingBottom: 15,
      // alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.4,
      shadowRadius: 3,
      elevation: 0,
      borderWidth: 0,
      borderColor: '#d3d3d3',
      margin: 12
      // alignSelf: 'center'
  },
  modalView: {
      // margin: 20,
      backgroundColor: '#fff',
      width: screenWidth * 0.9,
      padding: 20
  },
  openButton: {
      color: '#FF3A0A',
      fontWeight: '600'
  },
  textStyle: {
      color: 'white',
      fontWeight: 'bold',
      textAlign: 'center'
  },
  modalTitle: {
      fontSize: 16,
      marginBottom: 10,
      flexDirection: 'row',
  },
  modalMessage: {
      fontSize: 16,
      fontWeight: '400',
      marginBottom: 20,
  },
  modalActionBtn: {
      marginLeft: 40,
      marginTop: 10,
  }
});
export { LoaderComponent };
