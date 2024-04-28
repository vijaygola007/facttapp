import React, { useState, PureComponent } from 'react';
import { Text, StyleSheet, Modal, Dimensions, View, TouchableOpacity, BackHandler } from 'react-native';
import { Button, Snackbar } from 'react-native-paper';
import { Icon } from 'react-native-elements';
import NetInfo from "@react-native-community/netinfo";
import RNRestart from 'react-native-restart';

import * as store from '../../store';
import { getRegistrationData, getLocalUserData, getConnectivityModal, setConnectivityModal } from '../../utilities/helperFunctions';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

let colorLayout = store.default.getState().auth.colorLayout;

class Connectivity extends PureComponent {

    _netunsubscribe: any;
    _focus_unsubscribe: any;
    state = {
        showDialogBox: false,
        title: '',
        message: '',
        showOption: false
    }

    componentDidMount(){
        // if(!this._netunsubscribe){
            this.callInitials();
        // }
        
        // this._focus_unsubscribe = this.props['navigation'].addListener('focus', () => {
        //     this.props['navigation'].addListener('blur', () => {
        //         if(this._focus_unsubscribe){
        //             this._focus_unsubscribe();
        //         }
        //         if(this._netunsubscribe){
        //             this._netunsubscribe();
        //         }
        //     });
        //     if(!this._netunsubscribe){
        //         this.callInitials();
        //     }
        // });
        // this.props['navigation'].addListener('blur', () => {
        //     if(this._focus_unsubscribe){
        //         this._focus_unsubscribe();
        //     }
        //     if(this._netunsubscribe){
        //         this._netunsubscribe();
        //     }
        // });
    }

    callInitials(){
        this._netunsubscribe = NetInfo.addEventListener(net => {
            if(!net.isConnected){
                getConnectivityModal().then(data => {
                    // if(!data){
                        // setConnectivityModal('yes');
                        this.setState({
                            showDialogBox: true
                        })
                        getRegistrationData().then((reg_data: any) => {
                            if(reg_data){
                                getLocalUserData().then((user_data: any) => {
                                    if(user_data){
                                        this.setState({
                                            showOption: true,
                                            title: 'Confirmation',
                                            message: 'Continue application in offline mode ?'
                                        });
                                    }else{
                                        this.setState({
                                            showOption: false,
                                            title: 'Alert',
                                            message: 'Please check your network connection and try again'
                                        });
                                    }
                                }).catch((err) => {
                                    this.setState({
                                        showOption: false,
                                        title: 'Alert',
                                        message: 'Please check your network connection and try again'
                                    });
                                })
                            }else{
                                this.setState({
                                    showOption: false,
                                    title: 'Alert',
                                    message: 'Please check your network connection and try again'
                                });
                            }
                        }).catch((err) => {
                            this.setState({
                                showOption: false,
                                title: 'Alert',
                                message: 'Please check your network connection and try again'
                            });
                        })
                    // }
                })
                
            }else{
                this.setState({
                    showDialogBox: false
                })
            }
        });
    }

    componentWillUnmount() {
        if(this._netunsubscribe){
            this._netunsubscribe();
            // this._netunsubscribe.unsubscribe();
        }
    }
    

    render() {
        return (
            <Modal
                animationType='slide'
                transparent
                visible={this.state.showDialogBox}
                onRequestClose={() => {
                    
                }}
                onShow={() => {
                    
                }}
            >
            <View 
              style={{
                flex: 1,
                backgroundColor: '#fff',
                zIndex: 1,
                position: 'absolute',
                height: screenHeight,
                width: screenWidth,
                opacity: 1
              }}
            />
    
            <View style={{ ...styles.centeredView }}>
              <View style={styles.modalView}>
                <View>
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
                        {this.state.title}
                    </Text>
                </View>
    
                <Text style={{ ...styles.modalMessage, color: colorLayout.subTextColor, textAlign: 'center'}}>
                    {this.state.message}
                </Text>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                    }}
                >
    
                    {
                        this.state.showOption &&
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                width: screenWidth * 0.8
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    ...styles.modalActionBtn,
                                    backgroundColor: colorLayout.subHeaderBgColor,
                                }}
                                onPress={() => {
                                    this.setState({
                                        showDialogBox: false
                                    })
                                }}
                            >
                                <Text 
                                    style={{
                                        ...styles.openButton, 
                                        color: colorLayout.headerTextColor,
                                        
                                    }}
                                >
                                    Yes
                                </Text>
                            </TouchableOpacity>
    
                            <TouchableOpacity
                                style={{
                                    ...styles.modalActionBtn,
                                    backgroundColor: colorLayout.subHeaderBgColor,
                                }}
                                onPress={() => {
                                    BackHandler.exitApp();
                                }}
                            >
                                <Text 
                                    style={{
                                        ...styles.openButton, 
                                        color: colorLayout.headerTextColor,
                                        
                                    }}
                                >
                                    No
                                </Text>
                            </TouchableOpacity>
                        </View>
                    }
    
                    {
                        !this.state.showOption &&
                        <TouchableOpacity
                            style={{
                                ...styles.modalActionBtn,
                                backgroundColor: colorLayout.subHeaderBgColor,
                                alignSelf: 'center'
                            }}
                            onPress={() => {
                                RNRestart.Restart();
                            }}
                        >
                            <Text 
                                style={{
                                    ...styles.openButton, 
                                    color: colorLayout.headerTextColor,
                                }}
                            >
                                Retry
                            </Text>
    
                        </TouchableOpacity>
                    }
    
                  </View>
                </View>
              </View>
            </Modal>
        );
    }
}

const styles = StyleSheet.create({
    message: {
        fontSize: 16
    },
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
    historyView: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 10,
        paddingBottom: 15,
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
    },
    modalView: {
        backgroundColor: '#fff',
        width: screenWidth * 0.9,
        padding: 20
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
        justifyContent: 'center',
        flex: 1,
    },
    modalMessage: {
        fontSize: 16,
        fontWeight: '400',
        marginBottom: 20,
    },
    openButton: {
        fontWeight: '600',
        width: 100,
        textAlign: 'center'
    },
    modalActionBtn: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderRadius: 4,
        alignItems: 'center',
        marginHorizontal: 5
    }
});

export default Connectivity;
