import React, { PureComponent, useRef } from 'react';
import { 
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    Platform,
    LogBox,
    SafeAreaView,
    ScrollView,
    Animated,
    Easing
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'react-native-elements';
import RNFetchBlob from 'rn-fetch-blob';
import * as Animatable from 'react-native-animatable';
import NetInfo from "@react-native-community/netinfo";
import crashlytics from '@react-native-firebase/crashlytics';
import store from '../../store';
import RNFS from 'react-native-fs';

import { userData, totalSyncedSurvey, updateOfflineSurveyCount, serverSyncedSurveyCount } from '../../store/actions';
import { getLocalUserData, setTotalSyncedSurvey, getTotalSyncedSurvey } from '../../utilities/helperFunctions';
import { decrypt, urls, checksum, encrypt, GenerateRandomString, Is_Production_Environment } from '../../utilities/constants';

// database
import * as storageDB from '../../db';

// service
import { getService, postService, SendErrorLog, postFormDataService } from '../../api-services';

import { 
    Message, Connectivity
} from '../../components/common';

import * as config from '../../utilities/json/config.json';

import storage from '@react-native-firebase/storage';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export interface fileObject{
    fileName: string;
    fileSize: number;
    isCompleted: boolean;
    progress: number;
    uploadedSize: number;
    fileType: string;
    folderType: string;
    transNo: string;
    filePath: string;
    totalMedia: number;
}


class SyncData extends PureComponent {


    _unsubscribe: any;
    _netunsubscribe: any;
    PATH = (Platform.OS == 'ios' ? RNFS.CachesDirectoryPath : RNFS.ExternalDirectoryPath)+'/UnsyncedEvidence/';
    leftPosition = new Animated.Value(-Dimensions.get('window').width);

    constructor(props) {
        super(props);
    }

    state = {
        registration_code: '',
        showMessage: false,
        visible: false,
        message: '',
        is_initial_uploading_started: true,
        is_server_uploading_started: false,
        is_server_uploading_completed: false,
        is_downloading: false,
        type: '',
        headerTitle: '',
        sync_msg: '',
        total_evidences: 0,
        evidence_list: [],
        current_evidence_index: 0,
        is_evidences_compressing: false,
        current_uploading_evidence_index: 0,
        uploading_percentage: 0,
        current_evidence_size: '0 MB',
        current_evidence_media: '',
        user_data: {},
        isEvidenceUploadValid: true,
        isInspectionUploadValid: true,
        uploadingEvidenceInfo: [],
        evidenceObject: {},
        mediaTypeWiseGrouping: []
    };

    _focus_unsubscribe: any;
    componentDidMount() {
        this.mooveLR();
        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
        this.setState({
            type: ''
        })

        // this._focus_unsubscribe = this.props['navigation'].addListener('focus', () => {
            getLocalUserData().then((user_data: any) => {
                
                this.setState({
                    user_data: user_data
                }, () => {
                    this.CheckConnectivity(user_data);
                });
            });
        // });
    }


    componentWillUnmount(){
        if(this._unsubscribe){
            this._unsubscribe();
        }
        if(this._focus_unsubscribe){
            this._focus_unsubscribe();
        }
    }

    async onCrash(error_log: any) {
        crashlytics().log('Aboutus screen crash analytics');
        await Promise.all([
          crashlytics().setUserId(error_log.uid),
          crashlytics().setAttributes({
            ...error_log
          }),
        ]);
      }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        getLocalUserData().then((user: any) => {
            this.onCrash({
                screen: 'About Us',
                error: error.message,
                user: user ? JSON.stringify(user) : ''
            });
            crashlytics().crash();
        })
    }

    CheckConnectivity = async (user_data: any) => {
        
        var net = await NetInfo.fetch();
        if(net.isConnected && net.isInternetReachable){
            
            this.sendEvidencesToserver(user_data);
        }else{
           
            storageDB.runQuery(`DELETE from ${storageDB.inspected_survey_tbl}`);
            // storage.runQuery(`UPDATE ${storage.question_category_tbl} SET isSurveyCompleted = ${false}, isSurveySynced = ${false}`);
            this.setState({
                type: 'not_connected',
                showMessage: true,
                message: 'Internet connection is not available',
                headerTitle: 'Alert'
            });
        }
    };

    sendEvidencesToserver(user_data){
        storageDB.runQuery(`select * from ${storageDB.file_tbl} where is_synced = 0`).then(async (files: any) => {
            if(files.length > 0){
                try {
                   
                    var fileList: any = [];
                    for(const file of files){
                        var isExist = await RNFetchBlob.fs.exists(file.file_path);
                        if(isExist){
                            fileList.push(file);
                        }
                    }
                    if(fileList.length > 0){
                        this.setState({
                            sync_msg: 'Please wait... \n while we are uploading evidences to server',
                            total_evidences: fileList.length,
                            current_evidence_index: 0,
                            is_evidences_compressing: true,
                            evidence_list: fileList,
                            is_server_uploading_started: true,
                            is_server_uploading_completed: false,
                        }, async () => {
                            try {
                                for(const file of fileList){
                                    var stat = await RNFetchBlob.fs.stat(file.file_path);
                                    file.fileSize = stat.size;
                                }
                                this.uploadFileToFirebase(user_data, fileList);
                            } catch (error) {
                                SendErrorLog('Screen => SyncData > Method => sendEvidencesToserver', error);
                            }
                            
                        });
                    }else{
                        this.setState({
                            total_evidences: 0,
                            current_evidence_index: 0,
                            is_evidences_compressing: false,
                            is_server_uploading_started: false,
                            is_server_uploading_completed: false,
                            is_initial_uploading_started: true,
                            is_downloading: false,
                            evidence_list: []
                        }, () => {
                            this.uploadInspectionData();
                        });
                    } 
                } catch (error) {
                    SendErrorLog('Screen => SyncData > Method => sendEvidencesToserver', error);
                }
                
            }else{
                this.setState({
                    total_evidences: 0,
                    current_evidence_index: 0,
                    is_evidences_compressing: false,
                    is_server_uploading_started: false,
                    is_server_uploading_completed: false,
                    is_initial_uploading_started: true,
                    is_downloading: false,
                    evidence_list: []
                }, () => {
                    this.uploadInspectionData();
                });
            }
        }).catch((error) => {
            SendErrorLog('Screen => SyncData > Method => sendEvidencesToserver', error);
        })
    }

    formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes'
    
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
    
        const i = Math.floor(Math.log(bytes) / Math.log(k))
    
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }

    async uploadFileToFirebase(user_data: any, evidences: Array<object>){
        var list: any = {};
        
        evidences.forEach(async (item: any) => {
            var folderType = item.media_type;
            if(folderType == 'photo'){
                folderType = 'image';
            }
            list[item.file_name] = {
                fileName: item.file_name,
                fileSize: item.fileSize ? item.fileSize : 0,
                isCompleted: false,
                progress: 0,
                uploadedSize: 0,
                fileType: item.media_type,
                folderType: folderType,
                transNo: item.trans_no,
                filePath: item.file_path
            };
        });
        this.setMediaTypeGrouping(list);
        this.setState({
            evidenceObject: list,
            uploadingEvidenceInfo: Object.values(list),
        }, () => {
            (Object.values(this.state.evidenceObject) as any).forEach((obj: fileObject) => {

                var substr = decrypt(urls.domain).substring(0, decrypt(urls.domain).lastIndexOf('.'));
                substr = substr.substring(0, substr.lastIndexOf('.'));
                var hostname = substr.split('https://')[1];
                
                var path = `${hostname}/${this.state.user_data['tenantCode']}/${obj.transNo}/${obj.folderType}/${obj.fileName}`;
                
                const reference = storage().ref(path);

                const task = reference.putFile(obj.filePath);

                task.on('state_changed', taskSnapshot => {
                    // if(taskSnapshot.metadata.name){

                        var l = this.state.evidenceObject;

                        // l[taskSnapshot.metadata.name].fileSize = taskSnapshot.totalBytes;
                        // l[taskSnapshot.metadata.name].progress = taskSnapshot.bytesTransferred/taskSnapshot.totalBytes;
                        // l[taskSnapshot.metadata.name].uploadedSize = taskSnapshot.bytesTransferred;

                        // if(l[taskSnapshot.metadata.name].fileSize == l[taskSnapshot.metadata.name].uploadedSize){
                        //     l[taskSnapshot.metadata.name].isCompleted = true;
                        // }

                        // l[taskSnapshot.ref.fullPath.split(obj.folderType+'/')[1]].fileSize = taskSnapshot.totalBytes;
                        l[taskSnapshot.ref.fullPath.split(obj.folderType+'/')[1]].progress = taskSnapshot.bytesTransferred/taskSnapshot.totalBytes;
                        l[taskSnapshot.ref.fullPath.split(obj.folderType+'/')[1]].uploadedSize = taskSnapshot.bytesTransferred;

                        if(taskSnapshot.state == 'success'){
                            // l[taskSnapshot.ref.fullPath.split(obj.folderType+'/')[1]].isCompleted = true;
                            l[taskSnapshot.metadata.name].isCompleted = true;
                        }

                        this.setMediaTypeGrouping(l);
                        this.setState({
                            evidenceObject: l,
                            uploadingEvidenceInfo: Object.values(l)
                        });
                    // }
                });


                task.then(() => {
                    var l = this.state.evidenceObject;
                    
                    if(Object.values(l).filter((m: any) => m.isCompleted).length == Object.values(l).length){
                        this.setState({
                            is_server_uploading_started: true,
                            is_server_uploading_completed: true,
                            is_initial_uploading_started: true
                        }, () => {
                            this.uploadInspectionData();
                        });
                    }
                }).catch((error) => {
                    SendErrorLog('Screen => SyncData > Method => uploadInspectionData @ api => firebase @ params => '+obj.filePath, JSON.stringify(error));
                });
            })
        })
    }

    setMediaTypeGrouping(list: any){
        var videos  = (Object.values(list)).filter((m: any) => m.folderType == 'video');
        var audios  = (Object.values(list)).filter((m: any) => m.folderType == 'audio');
        var images  = (Object.values(list)).filter((m: any) => m.folderType == 'image');
        
        var mediaTypeWiseGrouping: any = [];
        if(videos.length > 0){
            var totalSize = videos.map((m: any) => m.fileSize).reduce((a, b) => a + b, 0);
            var uploadedSize = videos.map((m: any) => m.uploadedSize).reduce((a, b) => a + b, 0);
            mediaTypeWiseGrouping.push({
                fileSize: totalSize,
                isCompleted: videos.filter((m: any) => m.isCompleted).length == videos.length,
                progress: ((uploadedSize/totalSize)*100).toFixed(2),
                uploadedSize: uploadedSize,
                fileType: 'video',
                totalMedia: videos.length
            });
        }
        if(audios.length > 0){
            var totalSize = audios.map((m: any) => m.fileSize).reduce((a, b) => a + b, 0);
            var uploadedSize = audios.map((m: any) => m.uploadedSize).reduce((a, b) => a + b, 0);
            mediaTypeWiseGrouping.push({
                fileSize: totalSize,
                isCompleted: audios.filter((m: any) => m.isCompleted).length == audios.length,
                progress: ((uploadedSize/totalSize)*100).toFixed(2),
                uploadedSize: uploadedSize,
                fileType: 'audio',
                totalMedia: audios.length
            });
        }
        if(images.length > 0){
            var totalSize = images.map((m: any) => m.fileSize).reduce((a, b) => a + b, 0);
            var uploadedSize = images.map((m: any) => m.uploadedSize).reduce((a, b) => a + b, 0);
            // ((images.map((m: any) => m.progress).reduce((a, b) => a + b, 0)/images.length) * 100).toFixed(2)
            mediaTypeWiseGrouping.push({
                fileSize: totalSize,
                isCompleted: images.filter((m: any) => m.isCompleted).length == images.length,
                progress: ((uploadedSize/totalSize)*100).toFixed(2),
                uploadedSize: uploadedSize,
                fileType: 'image',
                totalMedia: images.length
            });
        }
        this.setState({
            mediaTypeWiseGrouping: mediaTypeWiseGrouping
        });
    }

    uploadFileRecurssively(user_data: any, evidences: string[], files: Array<object>, index: number = 0, running_index: number, uploaded_data_length: number){
        this.setState({
            current_uploading_evidence_index: index
        })
        if(uploaded_data_length == index){
            this.setState({
                is_server_uploading_started: true,
                is_server_uploading_completed: true,
                is_initial_uploading_started: true
            }, () => {
                this.uploadInspectionData();
            });
        }else{
            var file_path = (Platform.OS == 'android' ? 'file://' : '')+files[index]['file_path'];
            var media_type = `${files[index]['media_type'] == 'video' ? 'video/mp4' : files[index]['media_type'] == 'audio/mp4' ? 'mp3' : 'image/jpeg'}`;
            var file_name = files[index]['file_name'];
            var formData = new FormData();

            RNFetchBlob.fs.exists(file_path).then((is_exists) => {
                if(is_exists){
                    var uploading_percentage = (((index + 1)/uploaded_data_length)*100).toFixed(2);
                    RNFetchBlob.fs.stat(file_path).then((stat) => {
                        this.setState({
                            current_evidence_media: files[index]['media_type'].toUpperCase(),
                            current_evidence_size: (stat.size/1048576).toFixed(2)+ 'MB'
                        });
                    })
                    
                    this.setState({
                        is_server_uploading_started: true,
                        is_server_uploading_completed: false,
                        uploading_percentage: uploading_percentage
                    });
                    setTimeout(() => {
                        formData.append('', {
                            name: encodeURIComponent(file_name), 
                            uri: file_path, 
                            type: media_type
                        } as any);

                        var draft = {
                            userID: this.state.user_data['userId'],
                            loginId: this.state.user_data['loginId'],
                            regcode: this.state.user_data['regcode'],
                            transactionNo: '0',
                            type: 'Media',
                            error: '',
                            data: JSON.stringify({
                                name: encodeURIComponent(file_name), 
                                uri: file_path, 
                                type: media_type
                            })
                        }

                        postFormDataService(urls.evidence_upload, formData)
                        .then((result: any) => {
                            if(result){

                                if(result.responseCode == 2000){

                                }else{
                                    this.setState({
                                        isEvidenceUploadValid: false
                                    })
                                    SendErrorLog('Screen => SyncData > Method => uploadFileRecurssively @ api => '+urls.mobile_response, JSON.stringify(result));
                                    
                                    if(result && typeof(result) == 'number' && result !== 200){
                                        this.setState({
                                            type: 'not_connected',
                                            showMessage: true,
                                            message: 'Unable to upload evidences',
                                            headerTitle: 'Alert'
                                        });
                                        return;
                                    }

                                    RNFetchBlob.fs.mv(files[index]['file_path'], this.PATH).then((mv) => {
                                        
                                    }).catch((error) => {
                                        
                                    });
                                    storageDB.insertUnsyncedData_TBL(draft);
                                }
                            
                            }
                            else{
                                this.setState({
                                    isEvidenceUploadValid: false
                                });
                                RNFetchBlob.fs.mv(files[index]['file_path'], this.PATH).then((mv) => {
                                    
                                }).catch((error) => {
                                    
                                });
                                storageDB.insertUnsyncedData_TBL(draft);
                                SendErrorLog('Screen => SyncData > Method => uploadFileRecurssively @ api => '+urls.evidence_upload, 'Error While sending to mobile response api');
                            }
                            
                            this.uploadFileRecurssively(user_data, evidences, files, index + 1, running_index, uploaded_data_length);
                            
                        }).catch((error) => {
                            this.setState({
                                isEvidenceUploadValid: false
                            })
                            RNFetchBlob.fs.mv(files[index]['file_path'], this.PATH).then((mv) => {
                                
                            }).catch((error) => {
                                
                            });
                            storageDB.insertUnsyncedData_TBL(draft);

                            if(error.message.trim().toLowerCase() == 'network request failed'){
                                this.setState({
                                    type: 'not_connected',
                                    showMessage: true,
                                    message: 'Unable to upload evidences',
                                    headerTitle: 'Alert'
                                });
                                return;
                            }else{
                                this.uploadFileRecurssively(user_data, evidences, files, index + 1, running_index, uploaded_data_length);
                                SendErrorLog('Screen => SyncData > Method => uploadFileRecurssively @ api => '+urls.mobile_response,error.message);
                            }
                        });
                        
                    }, 2000);
                }else{
                    this.uploadFileRecurssively(user_data, evidences, files, index + 1, running_index, uploaded_data_length);
                }
            })
            
        }
        
    }

    uploadInspectionData(){
        this.setState({
            sync_msg: 'Please wait... \n Posting inspection data on server might take some time'
        });
        storageDB.runQuery(`select * from ${storageDB.survey_tbl} where is_synced = 0`).then((res: any) => {

            res = res.filter((f: any) => f.rawData);
            res.forEach((s: any) => {
                s['siteId'] = parseInt(s['siteId']);
                s['rawData'] = JSON.parse(s['rawData']);
                s['inspectionId'] = parseInt(s['inspectionId']);
                s['rawData'].forEach((assets: any) => {
                    if(assets.assetValue){
                        assets.assetValue = JSON.parse(assets.assetValue);
                        assets.assetValue.forEach((val: any) => {
                            val.assetCount = val.assetCount.toString();
                            val.assetValue = val.assetName;
                            val.AssetActualCount = val.count;
                        })
                    }
                })
            });
            if(res.length > 0){
                res.forEach((r: object, running_index: number) => {
                    
                    var draft = {
                        userID: this.state.user_data['userId'],
                        loginId: this.state.user_data['loginId'],
                        regcode: this.state.user_data['regcode'],
                        transactionNo: r['transactionNo'],
                        type: 'Survey',
                        error: '',
                        data: JSON.stringify(r)
                    }

                    postService(urls.mobile_response, r).then((response: any) => {
                        console.log(response);
                        if(response){
                            if(response.responseCode == 2000){
                                getTotalSyncedSurvey().then((d: any) => {
                                    var total = 0;
                                    if(d){
                                        total = parseInt(d);
                                    }
                                    total = total + 1;
                                    this.props['actions'].totalSyncedSurvey(total);
                                    setTotalSyncedSurvey(total.toString());
                                });
                            }else{

                                draft.error = JSON.stringify(response);
                                storageDB.insertUnsyncedData_TBL(draft);
                                this.setState({
                                    isInspectionUploadValid: false
                                })
                                SendErrorLog('Screen => SyncData > Method => uploadInspectionData @ api => '+urls.mobile_response+' @ params => '+JSON.stringify(r), JSON.stringify(response));
                                
                                if(response && typeof(response) == 'number' && response !== 200){
                                    this.setState({
                                        type: 'not_connected',
                                        showMessage: true,
                                        message: 'Unable to connect the server',
                                        headerTitle: 'Alert'
                                    });
                                    return;
                                }
                            }

                            if(running_index == res.length - 1){
                                this.setState({
                                    is_downloading: true,
                                    is_server_uploading_completed: true
                                }, () => {
                                    this.setModileData();
                                });
                            }
                            
                        }else{
                            storageDB.insertUnsyncedData_TBL(draft);
                            this.setState({
                                isInspectionUploadValid: false
                            })
                            SendErrorLog('Screen => SyncData > Method => uploadInspectionData @ api => '+urls.mobile_response+' @ params => '+JSON.stringify(r), 'Error While sending to mobile response api');
                        }
                        
                    })
                    .catch((error) => {
                        draft.error = JSON.stringify(error);
                        storageDB.insertUnsyncedData_TBL(draft);
                        this.setState({
                            isInspectionUploadValid: false
                        })
                        if(error.message.trim().toLowerCase() == 'network request failed'){
                            this.setState({
                                type: 'not_connected',
                                showMessage: true,
                                message: 'Internet connection is not available',
                                headerTitle: 'Alert'
                            });
                            return;
                        }else{
                            if(running_index == res.length - 1){
                                this.setState({
                                    is_downloading: true,
                                    is_server_uploading_completed: true
                                }, () => {
                                    this.setModileData();
                                });
                            }
                            SendErrorLog('Screen => SyncData > Method => uploadInspectionData @ api => '+urls.mobile_response+' @ params => '+JSON.stringify(r), error.message);
                        }
                    })
                })
            }else{
                this.setState({
                    is_downloading: true,
                    is_server_uploading_completed: true
                }, () => {
                    this.setModileData();
                });
            }
        }).catch((error) => {
            this.setState({
                is_downloading: true,
                is_server_uploading_completed: true
            }, () => {
                this.setModileData();
            });
        })
    }

    setModileData(){
        this.setState({
            sync_msg: 'Please wait...\n syncing data from server'
        });

        if(!this.state.isInspectionUploadValid || !this.state.isEvidenceUploadValid){
            this.props['navigation'].navigate('InspectionCategory', {
                showMessage: true,
                message: 'Error while uploading inspection data',
                headerTitle: "Message"
            });
            return;
        }
        getService(urls.mobile_data).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => SyncData > Method => setModileData @ api => '+urls.mobile_data, 'Error While getting mobile data');
                }
            }
            storageDB.runQuery(`select * from ${storageDB.survey_tbl}`).then((survey_list: any) => {
                this.props['actions'].serverSyncedSurveyCount(survey_list.length);
            }).catch((err) => {
    
            })
            storageDB.insertAllMobileData_TBL(res.responseCode == 2000 ? res.responseData.inspections : []);
            storageDB.runQuery(`DELETE from ${storageDB.survey_tbl}`);
            storageDB.runQuery(`DELETE from ${storageDB.file_tbl}`);
            storageDB.runQuery(`DELETE from ${storageDB.inspected_survey_tbl}`);
            this.props['actions'].updateOfflineSurveyCount(0);

            storageDB.runQuery(`UPDATE ${storageDB.question_category_tbl} SET isSurveyCompleted = ${false}, isSurveySynced = ${true}`);

            getService(urls.inspections).then((res: any) => {
                if(res){
                    if(res.responseCode == 5001 || res.responseCode == 5002){
                        SendErrorLog('Screen => SyncData > Method => setModileData @ api => '+urls.inspections, 'Error While getting inspections');
                    }
                }
                if(res.responseCode == 2000){
                    if(res['responseData'].length > 0){
                        storageDB.insertInspectionsData_TBL(res.responseCode == 2000 ? res.responseData : []);
                    }
                }
                setTimeout(function () {
                    this.setState({
                        is_downloading: true
                    }, () => {
                        this.props['navigation'].navigate('InspectionCategory', {
                            showMessage: true,
                            message: 'Uploading inspection data completed',
                            headerTitle: "Message"
                        });
                    })
                }.bind(this), 300)
                
            }).catch((error) => {
                SendErrorLog('Screen => SyncData > Method => setModileData @ api => '+urls.inspections, error.message);
                setTimeout(function () {
                    this.setState({
                        is_downloading: true
                    }, () => {
                        this.props['navigation'].navigate('InspectionCategory', {
                            showMessage: true,
                            message: 'Uploading inspection data completed',
                            headerTitle: "Message"
                        });
                    })
                }.bind(this), 300)
            });
            
            
        }).catch((error) => {
            SendErrorLog('Screen => SyncData > Method => setModileData @ api => '+urls.mobile_data, error.message);
        });
    }

    mooveLR = () => {
        Animated.timing(this.leftPosition, {
            toValue: 100,
            duration: 1000,// the duration of the animation
            easing: Easing.linear,
            useNativeDriver: false
        }).start(); // starts this annimation once this method is called
    };

    render() {
        const { colorLayout } = this.props as any;

        return (
            <SafeAreaView
                style={{backgroundColor: colorLayout.appBgColor, flex: 1}}
            >
                    
                
                <View
                    style={{
                        // flex: 0
                    }}
                >

                    <Image
                        style={{ width: screenWidth * 0.5, height: screenWidth * 0.5, alignSelf: 'center' }}
                        source={require('../../../assets/img/cloud.png')} 
                        resizeMode={'contain'}
                    />
                    

                    <View
                        style={{
                            borderTopWidth: 2,
                            paddingHorizontal: 20,
                            paddingVertical: 15,
                            borderColor: '#d3d3d3',
                            display: this.state.total_evidences > 0 ? 'flex' : 'none',
                            // minHeight: 90,
                            overflow: 'hidden',
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Text
                                style={{
                                    alignSelf: 'center',
                                    color: colorLayout.appTextColor,
                                    fontSize: 16,
                                    fontWeight: '500',
                                    opacity: 1
                                }}
                            >
                                Uploading Inspection Evidence
                            </Text>

                            {
                                this.state.is_server_uploading_completed &&
                                <Icon
                                    name='checkmark-circle'
                                    type='ionicon'
                                    color="#228B22"
                                    containerStyle={{
                                        alignSelf: 'center'
                                    }}
                                    iconStyle={{
                                        fontSize: 24,
                                    }}
                                    style={{
                                        height: 24,
                                        width: 24,
                                        marginTop: -3
                                    }}
                                    
                                /> 
                            }

                            {
                                (this.state.is_server_uploading_started && !this.state.is_server_uploading_completed) &&
                                <Animatable.Image 
                                    delay={50} 
                                    duration={200} 
                                    animation="zoomIn" 
                                    iterationCount={'infinite'}
                                    source={require('../../../assets/img/upload.png')} 
                                    resizeMode='contain'
                                    style={{height: 20, width: 20, tintColor: colorLayout.appTextColor}}
                                    useNativeDriver
                                />
                            }

                            {
                                !this.state.is_server_uploading_started &&
                                <Animatable.Image 
                                    delay={50} 
                                    duration={200} 
                                    animation="zoomIn" 
                                    iterationCount={1}
                                    source={require('../../../assets/img/upload.png')} 
                                    resizeMode='contain'
                                    style={{height: 20, width: 20, tintColor: colorLayout.appTextColor}}
                                    useNativeDriver
                                />
                            }
                        </View>

                    </View>

                    {
                        this.state.mediaTypeWiseGrouping.map((item: fileObject, index: number) => {
                            return (
                                <View
                                    style={{
                                        // flexDirection: 'row',
                                        borderTopWidth: 2,
                                        justifyContent: 'flex-start',
                                        paddingHorizontal: 20,
                                        paddingVertical: 15,
                                        borderColor: '#d3d3d3'
                                    }}
                                    key={index}
                                >
                                    <View
                                        style={{
                                            alignItems: 'flex-start',
                                            flexDirection: 'row',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <Text
                                            style={{
                                                // alignSelf: 'center',
                                                color: colorLayout.appTextColor,
                                                fontSize: 12,
                                                fontWeight: '500',
                                                opacity: 1
                                            }}
                                        >
                                            {item.fileType.toUpperCase()} [{item.totalMedia}] - {this.formatBytes(item.uploadedSize)}/{this.formatBytes(item.fileSize)}
                                        </Text>
                                        <Text
                                            style={{
                                                // alignSelf: 'center',
                                                color: colorLayout.appTextColor,
                                                fontSize: 12,
                                                fontWeight: '500',
                                                opacity: 1
                                            }}
                                        >
                                            {item.progress < 100 ? 'Uploading...' : 'Uploaded'} - {item.progress} %
                                        </Text>

                                    </View>



                                    <View
                                        style={{
                                            height: 10,
                                            width: '100%',
                                            backgroundColor: '#d3d3d3',
                                            flexDirection: 'row',
                                            marginTop: 10,
                                            borderRadius: 5,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <View
                                            style={{
                                                height: 10,
                                                width: item.progress+'%',
                                                backgroundColor: item.progress >= 100 ? 'green' : colorLayout.subHeaderBgColor,
                                                borderRadius: 5
                                            }}
                                        />
                                        
                                    </View>
                                    
                                </View>
                            );
                        })
                    }

                    <View
                        style={{
                            flexDirection: 'row',
                            borderTopWidth: 2,
                            justifyContent: 'space-between',
                            paddingHorizontal: 20,
                            paddingVertical: 15,
                            borderColor: '#d3d3d3'
                        }}
                    >
                        <Text
                            style={{
                                alignSelf: 'center',
                                color: colorLayout.appTextColor,
                                fontSize: 16,
                                fontWeight: '500',
                                opacity: 1
                            }}
                        >
                            Uploading Inspection Data
                        </Text>

                        {
                            this.state.is_initial_uploading_started && this.state.is_downloading &&
                            <Icon
                                name='checkmark-circle'
                                type='ionicon'
                                color="#228B22"
                                containerStyle={{
                                    alignSelf: 'center'
                                }}
                                iconStyle={{
                                    fontSize: 24,
                                }}
                                
                            /> 
                        }
                        {
                            this.state.is_initial_uploading_started && !this.state.is_downloading &&
                            <Animatable.Image 
                                delay={50} 
                                duration={200} 
                                animation="zoomIn" 
                                iterationCount={(this.state.is_server_uploading_completed || (this.state.is_initial_uploading_started && this.state.is_downloading==false)) ? 'infinite' : 1}
                                source={require('../../../assets/img/upload.png')} 
                                resizeMode='contain'
                                style={{height: 20, width: 20, tintColor: colorLayout.appTextColor}}
                                useNativeDriver
                            />
                        }
                        
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            borderTopWidth: 2,
                            borderBottomWidth: 2,
                            justifyContent: 'space-between',
                            paddingHorizontal: 20,
                            paddingVertical: 15,
                            borderColor: '#d3d3d3'
                        }}
                    >
                        <Text
                            style={{
                                alignSelf: 'center',
                                color: colorLayout.appTextColor,
                                fontSize: 16,
                                fontWeight: '500',
                                opacity: 1
                            }}
                        >
                            Downloading Inspections
                        </Text>

                        <View
                            style={{
                                transform: [
                                    {
                                        rotate: '180deg'
                                    }
                                ]
                            }}
                        >
                            {
                                this.state.is_downloading &&
                                <Animatable.Image 
                                    delay={50} 
                                    duration={200} 
                                    animation="zoomIn" 
                                    iterationCount={'infinite'}
                                    source={require('../../../assets/img/upload.png')} 
                                    resizeMode='contain'
                                    style={{height: 20, width: 20, tintColor: colorLayout.appTextColor}}
                                    useNativeDriver
                                />
                            }

                            {
                                !this.state.is_downloading &&
                                <Animatable.Image 
                                    delay={50} 
                                    duration={200} 
                                    animation="zoomIn" 
                                    iterationCount={1}
                                    source={require('../../../assets/img/upload.png')} 
                                    resizeMode='contain'
                                    style={{height: 20, width: 20, tintColor: colorLayout.appTextColor}}
                                    useNativeDriver
                                />
                            }
                        </View>

                    </View>

                </View>

                <View
                    style={{
                        flex: 1,
                        justifyContent: 'flex-end'
                    }}
                >
                    <Text
                        style={{
                            textAlign: 'center',
                            paddingBottom: 15,
                            color: colorLayout.appTextColor,
                            fontWeight: '500'
                        }}
                    >
                        {this.state.sync_msg}
                    </Text>
                </View>

                <Message 
                    message={this.state.message} 
                    backgroundColor={'#fff'} 
                    visible={this.state.showMessage}
                    duration={5000}
                    onDismiss={() => {
                        if(this.state.type == 'not_connected'){
                            this.setState({
                                showMessage: false
                            }, () => {
                                this.props['navigation'].navigate('InspectionCategory');
                            });
                        }else{
                            this.setState({
                                showMessage: false
                            });
                        }
                    }}
                    position={'bottom'}
                    headerTitle={this.state.headerTitle}
                    colorLayout={colorLayout}
                    animation={'fade'}
                ></Message>


                {/* <Connectivity {...this.props} /> */}

            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginBottom: 0,
        backgroundColor: '#ffffff',
    },
    cat_imag: {
        width: 30,
        height: 30,
        tintColor: '#FF3A0A',
        // marginTop: -5
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
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 4,
        width: screenWidth * 0.9,
        alignSelf: 'center',
        marginTop: 10
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
    },
    wrapper: {},
  slide1: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  slide2: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  slide3: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  text: {
    color: '#131313',
    fontSize: 30,
    fontWeight: 'bold'
  }
});

const mapStateToProps = ({auth}) => {
    return ({
        userData: auth.userData,
        inspectedSurvey: auth.inspectedSurvey,
        colorLayout: auth.colorLayout,
        totalSyncedSurvey: auth.totalSyncedSurvey
    });
};

const ActionCreators = Object.assign(
    { userData },
    { totalSyncedSurvey },
    { updateOfflineSurveyCount },
    { serverSyncedSurveyCount }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(SyncData);
