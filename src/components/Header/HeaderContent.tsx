/* eslint-disable max-len */
/* eslint-disable global-require */
import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Icon } from 'react-native-elements';

import RNFS from 'react-native-fs';
import { AlertComponent } from '../common';

import * as store from '../../store';

import { APP_PADDING, HEADER_HEIGHT } from '../../layout/wrapper';


const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

var colorLayout: any;

if(store){
  if(store.default){
    if(store.default.getState()){
      if(store.default.getState().auth){
        if(store.default.getState().auth.colorLayout){
          colorLayout = store.default.getState().auth.colorLayout
        }
      }
    }
  }
}

const NavigationDrawerStructure = ({navigation, route, params = null, screenProps, showDrawer}) => {

  const [site_count, set_site_count] = useState('0');
  
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [backArrow, setBackArrow] = useState([]);

  const user = store.default.getState().auth['userData'];
  useEffect(() => {
    checkDirectory();
    if(user['userRoleCode'] == 'CHMNGR'){
      setBackArrow(['Inspection Category','Confirmation', 'SyncData', 'Vouchers', 'Expense Detail'] as any);
    }else{
      setBackArrow(['Inspection Category','Confirmation', 'SyncData'] as any);
    }
    if(params && route == 'Sites'){
      set_site_count(params['totalAllSites'])
    }
  }, []);

  const checkDirectory = async () => {
    if(Platform.OS == 'android'){
      await RNFS.exists(RNFS.ExternalDirectoryPath+'/Evidences')
      .then(async (exist) => {
        if(!exist){
          await RNFS.mkdir(RNFS.ExternalDirectoryPath+'/Evidences');
        }
      })
      await RNFS.exists(RNFS.ExternalDirectoryPath+'/Images')
      .then(async (exist) => {
        if(!exist){
          await RNFS.mkdir(RNFS.ExternalDirectoryPath+'/Images');
        }
      })
      await RNFS.exists(RNFS.ExternalDirectoryPath+'/Videos')
      .then(async (exist) => {
          if(!exist){
              await RNFS.mkdir(RNFS.ExternalDirectoryPath+'/Videos');
          }
      })
      await RNFS.exists(RNFS.ExternalDirectoryPath+'/Audio')
      .then(async (exist) => {
          if(!exist){
              await RNFS.mkdir(RNFS.ExternalDirectoryPath+'/Audio');
          }
      })
      await RNFS.exists(RNFS.ExternalDirectoryPath+'/Logs')
      .then(async (exist) => {
          if(!exist){
              await RNFS.mkdir(RNFS.ExternalDirectoryPath+'/Logs');
          }
      })
      await RNFS.exists(RNFS.ExternalDirectoryPath+'/LogsZip')
      .then(async (exist) => {
          if(!exist){
              await RNFS.mkdir(RNFS.ExternalDirectoryPath+'/LogsZip');
          }
      })
      await RNFS.exists(RNFS.ExternalDirectoryPath+'/VoucherEvidence')
      .then(async (exist) => {
        if(!exist){
          await RNFS.mkdir(RNFS.ExternalDirectoryPath+'/VoucherEvidence');
        }
      })
      await RNFS.exists(RNFS.ExternalDirectoryPath+'/UnsyncedEvidence')
      .then(async (exist) => {
        if(!exist){
          await RNFS.mkdir(RNFS.ExternalDirectoryPath+'/UnsyncedEvidence');
        }
      })
    }
    if(Platform.OS == 'ios'){
        await RNFS.exists(RNFS.CachesDirectoryPath+'/Evidences')
        .then(async (exist) => {
            if(!exist){
                await RNFS.mkdir(RNFS.CachesDirectoryPath+'/Evidences');
            }
        })
        await RNFS.exists(RNFS.CachesDirectoryPath+'/Images')
        .then(async (exist) => {
            if(!exist){
                await RNFS.mkdir(RNFS.CachesDirectoryPath+'/Images');
            }
        })
        await RNFS.exists(RNFS.CachesDirectoryPath+'/Videos')
        .then(async (exist) => {
            if(!exist){
                await RNFS.mkdir(RNFS.CachesDirectoryPath+'/Videos');
            }
        })
        await RNFS.exists(RNFS.CachesDirectoryPath+'/Audio')
        .then(async (exist) => {
            if(!exist){
                await RNFS.mkdir(RNFS.CachesDirectoryPath+'/Audio');
            }
        })
        await RNFS.exists(RNFS.CachesDirectoryPath+'/Logs')
        .then(async (exist) => {
            if(!exist){
                await RNFS.mkdir(RNFS.CachesDirectoryPath+'/Logs');
            }
        })
        await RNFS.exists(RNFS.CachesDirectoryPath+'/LogsZip')
        .then(async (exist) => {
            if(!exist){
                await RNFS.mkdir(RNFS.CachesDirectoryPath+'/LogsZip');
            }
        })
        await RNFS.exists(RNFS.CachesDirectoryPath+'/VoucherEvidence')
        .then(async (exist) => {
            if(!exist){
                await RNFS.mkdir(RNFS.CachesDirectoryPath+'/VoucherEvidence');
            }
        })
        await RNFS.exists(RNFS.CachesDirectoryPath+'/UnsyncedEvidence')
        .then(async (exist) => {
          if(!exist){
            await RNFS.mkdir(RNFS.CachesDirectoryPath+'/UnsyncedEvidence');
          }
        })
    }
  }
  
  return (
    
    <View
      style={{
        width: screenWidth,
        // marginLeft: -2*APP_PADDING,
        paddingRight: APP_PADDING,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          // marginLeft: -10,
          // width: screenWidth,
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
      
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          
          <TouchableOpacity 
            onPress={async () => {       
              navigation.navigation.openDrawer();
            }}
            style={{
              // display: valid_routes.includes(route) || route.startsWith('Categories') ? 'flex' : 'none'
              display: showDrawer == true ? 'flex' : 'none',
              marginRight: -10
            }}
          >
            <Icon
              name='reorder-three-outline'
              type='ionicon'
              color={colorLayout.headerTextColor}
              size={40}
              containerStyle={{
                
              }}
              
            />
          </TouchableOpacity>

          <View
            style={{
              // width: screenWidth * 0.76,
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
          <Text
            style={{
              color: colorLayout.headerTextColor,
              fontWeight: '600',
              fontSize: 18,
              textAlignVertical: 'center',
              textAlign: 'left',
              alignSelf: 'center',
              marginLeft: 10
            }}
            numberOfLines={1}
            ellipsizeMode={'clip'}
          >
            {route}
          </Text>
          {
              route == 'Sites' && 
              <Text
                style={{
                  fontSize: 18,
                  marginLeft: 10,
                  textAlignVertical: 'center',
                  color: colorLayout.headerTextColor,
                  alignSelf: 'center'
                }}
                numberOfLines={1}
                ellipsizeMode={'clip'}
              >
                
                {params ? params['totalAllSites'] ? '('+params['totalAllSites']+')' : '' : ''}
              </Text>
            }
          </View>
        </View>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            display: !(backArrow as any).includes(route) ? 'flex' : 'none'
          }}
          onPress={() => {
            if(screenProps.canGoBack()){
              screenProps.goBack();
            }
          }}
          activeOpacity={0.8}
        >
          <Icon
            name='arrow-back'
            type='ionicons'
            color={colorLayout.headerTextColor}
            iconStyle={{
              fontSize: 30,
            }}
            
          />
        </TouchableOpacity>
      
      </View>

      

      {/* <View 
        style={{ 
          flexDirection: 'row',
          alignItems: 'center',
          paddingRight: 0,
          display: !(backArrow as any).includes(route) ? 'flex' : 'none'
        }}
      >
        <TouchableOpacity
          style={{
            flexDirection: 'row'
          }}
          onPress={() => {
            if(screenProps.canGoBack()){
              screenProps.goBack();
            }
          }}
          activeOpacity={0.8}
        >
          <Icon
            name='arrow-back'
            type='ionicons'
            color={colorLayout.headerTextColor}
            iconStyle={{
              fontSize: 30,
            }}
            
          />
        </TouchableOpacity>
      </View> */}

      <AlertComponent 
        message={warningMessage} 
        visible={showWarning}
        onCancel={() => {
          setShowWarning(false);
        }}
        onOk={() => {
          setShowWarning(false);
          navigation.navigation.replace("Question");
          navigation.navigation.replace("Confirmation");
          navigation.navigation.openDrawer();
        }}
        headerTitle="Confirmation"
        okText={'Yes'}
        cancelText={'No'}
    ></AlertComponent>

    </View>
    
  )
}


  const NavigationRightStructure = ({navigation, route, params = null, screenProps}) => {

  return (
    <View>

<View
      style={{
        flex: 1,
        flexDirection: 'row',
        width: screenWidth,
        // marginTop: -10
        alignItems: 'center',
        // maxWidth: screenWidth * 0.6
      }}
    >
      <TouchableOpacity 
        onPress={() => {
          navigation.navigation.openDrawer()
        }}
      >
        <Icon
          name='reorder-three-outline'
          type='ionicon'
          color='#ffffff'
          size={40}
          containerStyle={{
            marginLeft: 10,
            // marginTop: 10
          }}
          
        />
      </TouchableOpacity>
  
  
    </View>


    </View>
  );
}


export const headerNavigationOptions = ({ navigation, screenProps=null, showDrawer=false }, route: string, params: any = null) => {
  colorLayout = store.default.getState().auth.colorLayout;
  return ({
    title: null,
    headerLeft: () => <NavigationDrawerStructure navigation={navigation} route={route} params={params}  screenProps={screenProps} showDrawer={showDrawer}/>,
    // headerRight: () => <NavigationRightStructure navigation={navigation} route={route} params={params} screenProps={screenProps} />,
    headerStyle: {
      backgroundColor: colorLayout.headerBgColor,
      height: HEADER_HEIGHT,
    },
    headerTintColor: colorLayout.headerTextColor
  });
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      marginBottom: 0,
      backgroundColor: '#ffffff'
  },
  scan_img: {
      width: 30,
      height: 30,
  },
  centeredView: {
      flex: 1,
      // justifyContent: 'center',
      // alignItems: 'center',
      // marginTop: 22,
      zIndex: 2, 
      position: 'absolute',
      alignSelf: 'center',
      paddingTop: screenHeight * 0.35
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
      borderWidth: 0.2,
      borderColor: '#d3d3d3',
      margin: 12
      // alignSelf: 'center'
  },
  modalView: {
      // margin: 20,
      backgroundColor: '#ffffff',
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
      fontWeight: '600',
      color: '#131313',
  },
  modalInspectionNo: {
      fontSize: 14,
      fontWeight: '400',
      color: '#131313',
      marginTop: 10,
      opacity: 0.8
  },
  modalActionBtn: {
      marginLeft: 40
  }
});
