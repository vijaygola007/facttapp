// /* eslint-disable max-len */
/* eslint-disable global-require */
import React, { Component } from 'react';
import { ScrollView, Text, View, TouchableOpacity, 
  StyleSheet, Alert, Dimensions, Platform, Image, Linking } from 'react-native';
import { Avatar, Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Card } from 'react-native-paper';

import { getStatusBarHeight } from 'react-native-status-bar-height';
import DeviceInfo from 'react-native-device-info';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import RNFetchBlob from 'rn-fetch-blob';
import { zip } from 'react-native-zip-archive';
import RNFS from 'react-native-fs';
import NetInfo from "@react-native-community/netinfo";

import { 
  userData,
  allSites,
  allSiteType,
  totalSyncedSurvey
} from '../../store/actions';

import { hexToRgbA, urls, decrypt } from '../../utilities/constants';
import { MONTH_NAME } from '../../utilities/constants';
import { 
  deleteUserDataFromLocal, getLocalUserData, getRegistrationData, getTotalSyncedSurvey
} from '../../utilities/helperFunctions';
// import { navigate } from '../utilities/NavigationService';

// database
import * as storage from '../../db';

import { Message } from '../../components/common/Message';
import { AlertComponent } from '../../components/common/Alert';

import { 
  Connectivity
} from '../../components/common';
import { APP_PADDING, CARD_BORDER_RADIUS, PADDING_10, PADDING_12 } from '../../layout/wrapper';

// service
import { postFormDataService } from '../../api-services';

class DrawerContent extends Component {

  state = {
    userData: {},
    inspections_all: [],
    loggedin_user: {},
    completed_survey: 0,
    message: '',
    backgroundColor: '#fff',
    showMessage: false,
    modalMessage: '',
    openModal: false,
    registrationData: {},
    actionType: '',
    showOk: true,
    messageModalHeaderTitle: '',
    showLoader: false,
    mAppUrl: '',
    okText: 'Yes',
    cancelText: 'No',
    showCancelBtn: true,
    userImage: require('../../../assets/images/profile-image.png')
  };

  componentDidMount() {
    getLocalUserData().then(data => {
      if (data) {
        this.setState({
          userData: data,
          // userImage: {uri:decrypt(urls.domain)+'photo/'+data['loginId']+'.jpeg'}
          userImage: {uri:data['tenantAPIUrl']+'photo/'+data['tenantAPIUrl'].split('.')[0].split('://')[1]+'/'+data['loginId']+'.jpg'}
        });
      }
    });
    getRegistrationData().then(data => {
      if (data) {
        this.setState({ registrationData: data });
      }
    });
  }

  fetchTotalSyncedSurvey(){
    getTotalSyncedSurvey().then(d => {
      if(d){
        this.setState({
          completed_survey: d
        })
      }
    });
  }

  checkLogs(){
    this.setState({
      showMessage: true,
      message: 'Please wait... while we are uploading logs',
      showOk: false,
      messageModalHeaderTitle: 'Alert',
      showLoader: true
    });
    // this.sendLogsToserver();
    // getRegistrationData().then((regcode: any) => {
      const PATH = (Platform.OS == 'ios' ? RNFS.CachesDirectoryPath : RNFS.ExternalDirectoryPath)+'/Logs/';
      RNFetchBlob.fs.ls(PATH)
      .then(files => {
        if(files.length > 0){
          var date_arr: any = [];
          files.forEach((file_name: string) => {
            var splits = file_name.split('.json')[0].split('-');
            date_arr.push(splits[2]+'-'+(MONTH_NAME.indexOf(splits[1]) > 9 ? (MONTH_NAME.indexOf(splits[1]) + 1) : '0'+(MONTH_NAME.indexOf(splits[1]) + 1))+'-'+splits[0])
          });
          this.dateSegregation(date_arr, this.state.registrationData['regcode']);
        }else{
          this.sendLogsToserver();
        }
      })
    // })
  }

  dateSegregation = async (date_arr: any, regcode: string) => {

    var current_date = new Date();

    var curr_date = current_date.getUTCFullYear().toString();
    curr_date += '-'+(current_date.getUTCMonth() > 8 ? (current_date.getUTCMonth() + 1) : '0'+(current_date.getUTCMonth() + 1));
    curr_date += '-'+(current_date.getUTCDate() > 9 ? current_date.getUTCDate() : '0'+current_date.getUTCDate())

    if(!date_arr.includes(curr_date)){
      date_arr.push(curr_date);
    }

    date_arr.sort((a: string, b: string) => {
      return (new Date(a)).getTime() - (new Date(b)).getTime()
    });

    var startDate = new Date((new Date(date_arr[0])).getUTCFullYear(), 0, 1);

    var weeks: any = [];
    var dates_group: any = {};

    date_arr.forEach((dates: string) => {
      var days = Math.floor(((new Date(dates)).getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      var weekNumber: any = Math.ceil(days / 7);
      if(!weeks.includes(weekNumber)){
        weeks.push(weekNumber);
        if(!dates_group[weekNumber]){
          dates_group[weekNumber] = [];
        }
      }
      dates_group[weekNumber].push(dates)
    });
    weeks.sort((a: number, b: number) => {
      if(a > b){
        return 1;
      }
      if(a < b){
        return -1
      }
      return 0;
    });

    if(dates_group[weeks[weeks.length - 1]].length !== 7){
      delete dates_group[weeks[weeks.length - 1]];
    }

    const PATH = (Platform.OS == 'ios' ? RNFS.CachesDirectoryPath : RNFS.ExternalDirectoryPath)+'/LogsZip/';
    const JSON_FILE_PATH = (Platform.OS == 'ios' ? RNFS.CachesDirectoryPath : RNFS.ExternalDirectoryPath)+'/Logs/';

    for(var key in dates_group){
      var folder_name = PATH+''+regcode+'-'+dates_group[key][dates_group[key].length - 1].split('-').reverse().join('');

      await RNFS.mkdir(folder_name);
      JSON.parse(JSON.stringify(dates_group[key])).forEach(async (date_value) => {
        date_value = date_value.split('-');
        date_value[1] = MONTH_NAME[parseInt(date_value[1]) - 1];
        date_value = date_value.reverse().join('-');

        RNFS.exists(JSON_FILE_PATH+date_value+'.json')
        .then((is_exist) => {
          if(is_exist){
            RNFS.moveFile(JSON_FILE_PATH+date_value+'.json', folder_name+'/'+date_value+'.json')
            .then((result) => {
              
            })
            .catch((error) => {
              
            })
          }
        })
      
      })

      if(key == weeks[weeks.length - 1]){
        this.sendLogsToserver();
      }
    }
  }

  sendLogsToserver = () => {
    const PATH = (Platform.OS == 'ios' ? RNFS.CachesDirectoryPath : RNFS.ExternalDirectoryPath)+'/LogsZip/';
    RNFetchBlob.fs.ls(PATH)
    .then(files => {
      if(files.length > 0){
        var folders: any = [];
        files.forEach(async (file: any) => {
          var check = await RNFetchBlob.fs.isDir(PATH+file);

          if(check){
            folders.push(file);
          }
          
        });

        setTimeout(() => {
          folders.forEach((file: string, index: number) => {
            zip(PATH+file, PATH+file+'.zip')
            .then((path) => {
              this.uploadLogs(path, file+'.zip', PATH+file, index, folders.length - 1);
            })
            .catch((error) => {
              if(index == folders.length - 1){
                this.setState({
                  showMessage: true,
                  message: 'Logs uploaded successfully',
                  showOk: true,
                  messageModalHeaderTitle: 'Success',
                  showLoader: false
                });
              }
            })
          })
        }, 100);
      }else{
        setTimeout(() => {
          this.setState({
            showMessage: true,
            message: 'Logs not found',
            showOk: true,
            messageModalHeaderTitle: 'Alert',
            showLoader: false
          });
        }, 1000);
      }
    });
  }

  uploadLogs = (path: string, file_name: string, folder_path: string, index: number, length: number) => {
    var file_path = 'file://'+path;
    var formData = new FormData();

    formData.append('', {
      name: encodeURIComponent(file_name), 
      uri: file_path, 
      type: 'application/zip'
    } as any);

    postFormDataService(urls.log_upload, formData)
    .then((result: any) => {
      if(result.responseCode == 2000){
        RNFS.unlink(path);
        RNFS.unlink(folder_path);
      }
      if(index == length){
        this.setState({
          showMessage: true,
          message: 'Logs uploaded successfully',
          showOk: true,
          messageModalHeaderTitle: 'Success',
          showLoader: false
        });
      }
    }).catch((error) => {
      if(index == length){
        this.setState({
          showMessage: true,
          message: 'Logs uploaded successfully',
          showOk: true,
          messageModalHeaderTitle: 'Success',
          showLoader: false
        });
      }
    })
  }

  getOfflineSurveyCount(){
    const { updateOfflineSurveyCount } = this.props as any;
    return updateOfflineSurveyCount;
  }

  getServerSyncedSurveyCount(){
    const { serverSyncedSurveyCount, userData } = this.props as any;
    return serverSyncedSurveyCount;
  }

  render() {
    const { colorLayout, userData } = this.props as any;
    return (
      <SafeAreaView
        edges={['left']}
        style={{
          flex: 1
        }}
      >

        <ScrollView 
          style={{
            flex: 1,
          }}
        >
          <View
            style={{
              backgroundColor: colorLayout.headerBgColor,
              paddingTop: Platform.OS == 'ios' ? (getStatusBarHeight()) + 0 : getStatusBarHeight() + 10,
              paddingHorizontal: 12,
              paddingBottom: 4
            }}
          >
          
          </View>
          <View
            style={{
              ...styles.userSection,
              backgroundColor: colorLayout.headerBgColor,
            }}
          >
            
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              

            <View
              style={{
                // borderColor: colorLayout.headerTextColor,
                // borderWidth: 1,
                // borderRadius: moderateScale(50),
                // height: moderateScale(50),
                // width: moderateScale(50),
                // justifyContent: 'center',
                // overflow: 'hidden'
              }}
            >
              {/* <Icon
                name='user'
                type='feather'
                color={colorLayout.headerTextColor}
                size={moderateScale(42)}
              /> */}

              <Image
                style={{ 
                  height: moderateScale(50),
                  width: moderateScale(50),
                  borderRadius: moderateScale(50),
                }}
                source={this.state.userImage} 
                resizeMode={'cover'}
                onError={() => {
                  this.setState({
                    userImage: require('../../../assets/images/profile-image.png')
                  })
                }}
              />
            </View>

            <View
              style={{
                marginLeft: 10
              }}
            >
              <Text
                style={{
                  color: colorLayout.headerTextColor,
                  fontSize: moderateScale(14),
                  textTransform: 'uppercase',
                  fontWeight: '800'
                }}
              >
                {userData['userName']}
              </Text>
              <Text
                style={{
                  color: colorLayout.headerTextColor,
                  fontSize: moderateScale(11.5),
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}
              >
                REG CODE - {userData['regCode']}
              </Text>
              <Text
                style={{
                  color: colorLayout.headerTextColor,
                  fontSize: moderateScale(10.5),
                  fontWeight: '600',
                  textTransform: 'uppercase',
                }}
              >
                Logged On: {userData['lastLoggedOn']}
              </Text>
              <Text
                style={{
                  color: colorLayout.headerTextColor,
                  fontSize: moderateScale(10.5),
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  display: userData['sameAuditAndChannel'] || (userData['userRoleCode'] ? userData['userRoleCode'].toLowerCase().trim() : '') == 'muser' ? 'flex' : 'none'
                }}
              >
                Synced On: {userData['lastDataSycnOn']}
              </Text>
              

            </View>
            </View>
            
          </View>

          <View
            style={{
              backgroundColor: colorLayout.cardBgColor,
              // paddingVertical: APP_PADDING
            }}
          >

            <View 
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: APP_PADDING,
                display: userData['sameAuditAndChannel'] || (userData['userRoleCode'] ? userData['userRoleCode'].toLowerCase().trim() : '') == 'muser' ? 'flex' : 'none'
              }}
            >

            <Card
              elevation={10}
              style={{
                borderRadius: CARD_BORDER_RADIUS,
                height: 62,
                flex: 1,
                marginHorizontal: APP_PADDING
              }}
            >
              <Card.Content
                style={{
                }}
              >
              <View
                style={{
                  marginTop: -16
                }}
              >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '600',
                  color: colorLayout.subHeaderBgColor,
                  textAlign: 'center',
                  textAlignVertical: 'top',
                  marginTop: 3
                }}
              >
                {userData['totalInspection'] + this.getServerSyncedSurveyCount()}
              </Text>
              <Text
                style={{
                  color: colorLayout.subTextColor,
                  textAlignVertical: 'bottom',
                  fontWeight: '600',
                  textAlign: 'center',
                  marginTop: 3,
                  fontSize: 12
                }}
              >
                
                {'Sync Data'}
              </Text>
              </View>
              </Card.Content>
            </Card>

            <Card
              elevation={10}
              style={{
                borderRadius: CARD_BORDER_RADIUS,
                height: 62,
                flex: 1,
                marginHorizontal: APP_PADDING
              }}
            >
              <Card.Content>
              <View
                style={{
                  marginTop: -16
                }}
              >
                <Text
                style={{
                  fontSize: 24,
                  fontWeight: '600',
                  color: colorLayout.subHeaderBgColor,
                  textAlign: 'center',
                  textAlignVertical: 'top',
                  marginTop: 3
                }}
              >
                {(userData['userRole'] ? userData['userRole'].toLowerCase().trim() : '') == 'channel manager' ? userData['approvedVoucher'] : this.getOfflineSurveyCount()}
              </Text>
              <Text
                style={{
                  color: colorLayout.subTextColor,
                  textAlignVertical: 'bottom',
                  fontWeight: '600',
                  marginTop: 3,
                  textAlign: 'center',
                  fontSize: 12
                }}
              >
                
                {(userData['userRole'] ? userData['userRole'].toLowerCase().trim() : '') == 'channel manager' ? 'Approved' : 'Offline Data'}
              </Text>
              </View>
              
              </Card.Content>
            </Card>

            </View>

            <View 
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: APP_PADDING,
                display: (userData['sameAuditAndChannel'] || (userData['userRole'] ? userData['userRole'].toLowerCase().trim() : '') == 'channel manager') ? 'flex' : 'none',
                backgroundColor: hexToRgbA(colorLayout.headerBgColor, '0.2')
              }}
            >

            <Card
              elevation={10}
              style={{
                borderRadius: CARD_BORDER_RADIUS,
                height: 62,
                flex: 1,
                marginHorizontal: APP_PADDING,
                overflow: 'hidden'
              }}
            >
              <Card.Content
                style={{
                  // backgroundColor: hexToRgbA(colorLayout.headerBgColor, '0.2')
                }}
              >
              <View
                style={{
                  marginTop: -16,
                }}
              >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '600',
                  color: colorLayout.subHeaderBgColor,
                  textAlign: 'center',
                  textAlignVertical: 'top',
                  marginTop: 3
                }}
              >
                {userData['noOfExpenseVoucher']}
              </Text>
              <Text
                style={{
                  color: colorLayout.subTextColor,
                  textAlignVertical: 'bottom',
                  fontWeight: '600',
                  marginTop: 3,
                  textAlign: 'center',
                  fontSize: 12
                }}
              >
                
                Vouchers
              </Text>
              </View>
              </Card.Content>
            </Card>

            <Card
              elevation={10}
              style={{
                borderRadius: CARD_BORDER_RADIUS,
                height: 62,
                flex: 1,
                marginHorizontal: APP_PADDING,
                overflow: 'hidden'
              }}
            >
              <Card.Content
                style={{
                  // backgroundColor: hexToRgbA(colorLayout.headerBgColor, '0.2')
                }}
              >
              <View
                style={{
                  marginTop: -16
                }}
              >
                <Text
                style={{
                  fontSize: 24,
                  fontWeight: '600',
                  color: colorLayout.subHeaderBgColor,
                  textAlign: 'center',
                  textAlignVertical: 'top',
                  marginTop: 3,
                }}
              >
                {userData['approvedVoucher']}
              </Text>
              <Text
                style={{
                  color: colorLayout.subTextColor,
                  textAlignVertical: 'bottom',
                  fontWeight: '600',
                  marginTop: 3,
                  textAlign: 'center',
                  fontSize: 12
                }}
              >
                
                Approved
              </Text>
              </View>
              
              </Card.Content>
            </Card>

            </View>



          </View>

          <View style={{...styles.sidebarViewItem, display: userData['sameAuditAndChannel'] || (userData['userRoleCode'] ? userData['userRoleCode'].toLowerCase().trim() : '') == 'muser' ? 'flex' : 'none'}}>
            
            <TouchableOpacity
              style={{
                backgroundColor: '#fff'
              }}
              onPress={() => {
                this.props['navigation'].navigate('StackNavigator', {
                  screen: 'InspectionCategory'
                });
              }}
              activeOpacity={1}
            >
              <View style={styles.button}>
                <Icon
                  name='mode-edit'
                  type='material'
                  color={colorLayout.subTextColor}
                  size={20}
                  
                />
                <Text style={{...styles.buttonText, color: colorLayout.appTextColor}}>New Inspection</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{...styles.sidebarViewItem, display: userData['sameAuditAndChannel'] || (userData['userRoleCode'] ? userData['userRoleCode'].toLowerCase().trim() : '') == 'muser' ? 'flex' : 'none'}}>
            
            <TouchableOpacity
              style={{
                backgroundColor: 'white'
              }}
              onPress={() => {
                this.props['navigation'].navigate('StackNavigator', {
                  screen: 'InspectionReport'
                })
              }}
              activeOpacity={1}
            >
              <View style={styles.button}>
                <Icon
                  name='profile'
                  type='ant-design'
                  color={colorLayout.subTextColor}
                  size={20}
                  
                />
                <Text style={{...styles.buttonText, color: colorLayout.appTextColor}}>Inspection Report</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={{...styles.sidebarViewItem, display: userData['sameAuditAndChannel'] || (userData['userRole'] ? userData['userRole'].toLowerCase().trim() : '') == 'channel manager' ? 'flex' : 'none'}}>
            
            <TouchableOpacity
              style={{
                backgroundColor: 'white'
              }}
              onPress={async() => {
                var net = await NetInfo.fetch();
                if(net.isConnected && net.isInternetReachable){
                  this.props['navigation'].navigate('StackNavigator', {
                    screen: 'AddVoucher'
                  })
                }else{
                  this.setState({
                    showMessage: true,
                    message: 'Internet connection is not available',
                    showOk: true,
                    messageModalHeaderTitle: 'Alert',
                    showLoader: false
                  });
                }
                
              }}
              activeOpacity={1}
            >
              <View style={styles.button}>
                <Icon
                  name='ticket-alt'
                  type='fontisto'
                  color={colorLayout.subTextColor}
                  size={20}
                  
                />
                <Text style={{...styles.buttonText, color: colorLayout.appTextColor}}>New Voucher</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{...styles.sidebarViewItem, display: userData['sameAuditAndChannel'] || (userData['userRole'] ? userData['userRole'].toLowerCase().trim() : '') == 'channel manager' ? 'flex' : 'none'}}>
            
            <TouchableOpacity
              style={{
                backgroundColor: 'white'
              }}
              onPress={() => {
                this.props['navigation'].navigate('StackNavigator', {
                  screen: 'VoucherList'
                })
              }}
              activeOpacity={1}
            >
              <View style={styles.button}>
                <Icon
                  name='tagso'
                  type='ant-design'
                  color={colorLayout.subTextColor}
                  size={20}
                  
                />
                <Text style={{...styles.buttonText, color: colorLayout.appTextColor}}>Vouchers</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{
              ...styles.sidebarViewItem, 
              display: userData['sameAuditAndChannel'] || (userData['userRoleCode'] ? userData['userRoleCode'].toLowerCase().trim() : '') == 'muser' ? 'flex' : 'none'
            }}>
            
            <TouchableOpacity
              style={{
                backgroundColor: 'white'
              }}
              onPress={async () => {     
                var net = await NetInfo.fetch();
                if(net.isConnected && net.isInternetReachable){
                  this.props['navigation'].toggleDrawer();
                  storage.runQuery(`select * from ${storage.survey_tbl} where is_synced = 0`).then((res: any) => {
                    storage.runQuery(`select * from ${storage.file_tbl} where is_synced = 0`).then((files: any) => {
                      if(res.length > 0 || files.length > 0){
                        this.props['navigation'].navigate('SyncData');
                      }else{
                        this.setState({
                          showMessage: true,
                          message: 'No inspection data to upload on server',
                          showOk: true,
                          messageModalHeaderTitle: 'Alert',
                          showLoader: false
                        });
                      }
                    })
                  })
                }else{
                  this.setState({
                    showMessage: true,
                    message: 'Internet connection is not available',
                    showOk: true,
                    messageModalHeaderTitle: 'Alert',
                    showLoader: false
                  });
                }
                
              }}
              activeOpacity={1}
            >
              <View style={styles.button}>
                <Icon
                  name='sync'
                  type='material'
                  color={colorLayout.subTextColor}
                  size={25}
                  
                />
                <Text style={{...styles.buttonText, color: colorLayout.appTextColor}}>Synchronize Data</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{...styles.sidebarViewItem, display: userData['sameAuditAndChannel'] || (userData['userRoleCode'] ? userData['userRoleCode'].toLowerCase().trim() : '') == 'muser' ? 'flex' : 'none'}}>
            
            <TouchableOpacity
              style={{
                backgroundColor: '#fff'
              }}
              onPress={() => {
                this.props['navigation'].navigate('StackNavigator', {
                  screen: 'Draft'
                });
              }}
              activeOpacity={1}
            >
              <View style={styles.button}>
                <Icon
                  name='drafts'
                  type='material'
                  color={colorLayout.subTextColor}
                  size={20}
                  
                />
                <Text style={{...styles.buttonText, color: colorLayout.appTextColor}}>Inspection's Draft</Text>
              </View>
            </TouchableOpacity>
          </View>
            
          {
            this.state.userData['enableLog'] &&
            <View style={styles.sidebarViewItem}>
            
            <TouchableOpacity
              style={{
                backgroundColor: 'white'
              }}
              onPress={() => {
                this.checkLogs();
              }}
              activeOpacity={1}
            >
              <View style={styles.button}>
                <Icon
                  name='file-upload'
                  type='material'
                  color={colorLayout.subTextColor}
                  size={20}
                  
                />
                <Text style={{...styles.buttonText, color: colorLayout.appTextColor}}>Upload Logs</Text>
              </View>
            </TouchableOpacity>
          </View>
          }
          

          <View style={styles.sidebarViewItem}>
            
            <TouchableOpacity
              style={{
                backgroundColor: 'white'
              }}
              onPress={() => {
                this.props['navigation'].navigate('StackNavigator', {
                  screen: 'HelpDesk'
                })
              }}
              activeOpacity={1}
            >
              <View style={styles.button}>
                <Icon
                  name='questioncircleo'
                  type='ant-design'
                  color={colorLayout.subTextColor}
                  size={20}
                  
                />
                <Text style={{...styles.buttonText, color: colorLayout.appTextColor}}>Help Desk (Support)</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.sidebarViewItem}>
            
            <TouchableOpacity
              style={{
                backgroundColor: 'white'
              }}
              onPress={() => {
                this.props['navigation'].navigate('StackNavigator', {
                  screen: 'AboutUs'
                })
              }}
              activeOpacity={1}
            >
              <View style={styles.button}>
                <Icon
                  name='exclamationcircleo'
                  type='ant-design'
                  color={colorLayout.subTextColor}
                  size={20}
                  
                />
                <Text style={{...styles.buttonText, color: colorLayout.appTextColor}}>About Us</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.sidebarViewItem}>
            
            <TouchableOpacity
              onPress={() => {
                this.props['navigation'].toggleDrawer();
                this.setState({
                  openModal: true,
                  modalMessage: 'Are you sure want to logout ?',
                  actionType: 'logout',
                  messageModalHeaderTitle: 'Logout',
                  okText: 'Yes',
                  cancelText: 'No',
                  showCancelBtn: true
                });
              }}
              activeOpacity={1}
            >
              <View style={styles.button}>
              <Icon
                name='log-out-outline'
                type='ionicon'
                color={colorLayout.subTextColor}
                size={20}
                
              />
                <Text style={{...styles.buttonText, color: colorLayout.appTextColor}}>Logout</Text>
              </View>
            </TouchableOpacity>
          </View>
        
        </ScrollView>

        <View
          style={{
            flex: 0,
            margin: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: Platform.OS == 'ios' && DeviceInfo.hasNotch() ? 24 : 0,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
            }}
          >
            <Text
              style={{
                fontSize: 9,
                color: colorLayout.subTextColor,
                width: 56
              }}
              numberOfLines={1}
              ellipsizeMode={'clip'}
            >
              Powered By : 
            </Text>
            <Text
              style={{
                fontSize: 9,
                color: colorLayout.subTextColor,
                width: 95
              }}
            >{colorLayout.appDevBy}</Text>
          </View>
          <View
            style={{
              flexDirection: 'row'
            }}
          >
            <Text
              style={{
                fontSize: 9,
                color: colorLayout.subTextColor
              }}
            >Version : </Text>
            <Text
              style={{
                fontSize: 9,
                color: colorLayout.appTextColor
              }}
            >v{DeviceInfo.getVersion()}</Text>
          </View>
        </View>

        <Message 
          message={this.state.message} 
          backgroundColor={this.state.backgroundColor} 
          visible={this.state.showMessage}
          duration={5000}
          onDismiss={() => {
            this.setState({
              showMessage: false
            });
          }}
          position={'bottom'}
          headerTitle={this.state.messageModalHeaderTitle}
          colorLayout={colorLayout}
          showOk={this.state.showOk}
          animation={'fade'}
          showLoader={this.state.showLoader}
        ></Message>

          <AlertComponent 
            message={this.state.modalMessage} 
            visible={this.state.openModal}
            animation={'fade'}
            onCancel={() => {
              this.setState({
                openModal: false
              });
            }}
            onOk={() => {
              this.setState({
                openModal: false
              }, () => {
                if(this.state.actionType == 'logout'){
                  getRegistrationData().then((r: any) => {
                    // deleteUserDataFromLocal();
                    if(r.authType == 'MANUAL' || !r.authType){
                      
                      this.props['navigation'].navigate('AuthStackNavigator', {
                        screen: 'Login',
                        params: r
                      });
                    }
                    else{
                      this.props['navigation'].navigate('AuthStackNavigator', {
                        screen: 'FaceLogin',
                        props: r
                      });
                    }
                  });
                }
                if(this.state.actionType == 'update'){
                  Linking.openURL(this.state.mAppUrl);
                }
                
              });
            }}
            headerTitle={this.state.messageModalHeaderTitle}
            okText={this.state.okText}
            cancelText={this.state.cancelText}
            showCancel={this.state.showCancelBtn}
          />

          <Connectivity {...this.props} />
        
        </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  userSection: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 20
  },
  forgotPasswordButton: {
      alignSelf: 'flex-end',
      marginTop: moderateScale(15)
  },
  forgotPassword: {
      margin: moderateScale(5),
      marginRight: 0,
      fontSize: moderateScale(12),
      textDecorationLine: 'underline'
  },
  container: {
    paddingTop: 60,
    alignItems: 'center'
  },
  button: {
    flexDirection: 'row', 
    alignItems: 'center', 
  },
  buttonText: {
    paddingLeft: 20,
    fontSize: 14,
    minWidth: 100,
    fontWeight: '500',
    textAlignVertical: 'center'
  },
  sidebarViewItem: {
    flex: 1,
    justifyContent: 'space-around',
    borderBottomWidth: 0.6, 
    borderBottomColor: '#dcdedd',
    padding: PADDING_12,
    // fontSize: 10
  }
});

const mapStateToProps = ({auth}) => {
  return ({
    userData: auth.userData,
    colorLayout: auth.colorLayout,
    totalSyncedSurvey: auth.totalSyncedSurvey,
    updateOfflineSurveyCount: auth.updateOfflineSurveyCount,
    serverSyncedSurveyCount: auth.serverSyncedSurveyCount
  });
}

const ActionCreators = Object.assign(
  { userData },
  { allSites },
  { allSiteType }
);

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(DrawerContent as any);
