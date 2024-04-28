import React, { PureComponent } from 'react';
import { 
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
    Linking,
    LogBox,
    ActivityIndicator,
    StatusBar,
    AppState,
    Platform
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'react-native-elements';
import Spinner from 'react-native-loading-spinner-overlay';
import NetInfo from "@react-native-community/netinfo";
import crashlytics from '@react-native-firebase/crashlytics';
import { getVersion } from 'react-native-device-info';
import Geolocation from 'react-native-geolocation-service';

import { userData, colorLayout, allSites, allSiteType, 
    totalSyncedSurvey, updateOfflineSurveyCount, setSiteId, setInspectionStartDateTime, setUserCategoryQuestions } from '../../store/actions';

// database
import * as DB_Storage from '../../db';

import { urls, decrypt, encrypt } from '../../utilities/constants';
import { getService, SendErrorLog, postFormDataService } from '../../api-services';
import { getTotalSyncedSurvey } from '../../utilities/helperFunctions';

import { getLocalUserData, getRegistrationData } from '../../utilities/helperFunctions';

import { 
    Message,
} from '../../components/common';
// wrappers
import { Wrapper, ContentWrapper2, TEXT_SIZE_18, TEXT_SIZE_26, BODY_CONTAINER_WIDTH,
    PADDING_12, PADDING_10, HEADER_HEIGHT, SCREEN_HEIGHT, APP_PADDING, BODY_CONTAINER_HEIGHT
} from '../../layout/wrapper';
import RNFetchBlob from 'rn-fetch-blob';


import { utils } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

class InspectionCategory extends PureComponent {

    _unsubscribe: any;
    _state_subscribe: any;

    constructor(props) {
        super(props);
    }

    state = {
        registration_code: '',
        showMessage: false,
        message: '',
        camera: null,
        takingPic: false,
        userData: null,
        site_type: [],
        spinner: true,
        height: SCREEN_HEIGHT,
        isVersionHigher: false,
        actionType: '',
        messageModalHeaderTitle: '',
        mAppUrl: '',
        showCancelBtn: false,
        okText: ''
    };

    _netunsubscribe: any;
    componentDidMount() {
        auth().signInAnonymously()
        .then(() => {
            
        })
        .catch(error => {
            console.error(error);
        });

        this.totalSynced();
        this.checkAppVersion();
        this.props['navigation'].addListener('focus', (e: any) => {
           this.totalSynced();
        });

        this.GetAllData();
        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
        this._unsubscribe = this.props['navigation'].addListener('beforeRemove', (e: any) => {
            if(e.data.action.type == 'GO_BACK'){
                e.preventDefault();
            }
            return;
        });

        this._state_subscribe = AppState.addEventListener('change', async nextAppState => {
            if(nextAppState == 'active'){
                this.checkAppVersion();
            }
        });

    }

    checkAppVersion(){

        getRegistrationData().then((data: any) => {
            var currentVersion = parseInt(getVersion().split('.').join(''));
            var availableVersion = parseInt(data.mAppVer.split('.').join(''));
            var isVersionHigher = availableVersion > currentVersion;
        
            this.setState({
                showMessage: isVersionHigher,
                isVersionHigher: isVersionHigher,
                message: 'New application version ('+data.mAppVer+') is available on server',
                actionType: 'update',
                messageModalHeaderTitle: 'Update App',
                mAppUrl: data.mAppUrl,
                showCancelBtn: false,
                okText: 'Download'
            });
          
        });
    }
    
    componentWillUnmount(){
        if(this._state_subscribe){
            this._state_subscribe.remove();
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

    async totalSynced(){
        var net = await NetInfo.fetch();
        
        DB_Storage.createInspectedSurveyCategory_TBL();
        DB_Storage.runQuery(`select * from ${DB_Storage.survey_tbl}`).then((survey_list: any) => {
            this.props['actions'].updateOfflineSurveyCount(survey_list.length);
        }).catch((err) => {

        })
        getTotalSyncedSurvey().then((d: any) => {
            this.props['actions'].totalSyncedSurvey(d ? parseInt(d) : 0);
        });

        (this.props as any).actions.setSiteId({
            siteId: 0,
            sTypeId: 0
        });

        if(this.props['route']){
            if(this.props['route'].params){
                if(this.props['route'].params.showMessage){
                    this.props['navigation'].setParams({showMessage: false});
                    this.setState({
                        showMessage: true,
                        message: 'Uploading inspection data completed',
                        actionType: '',
                        messageModalHeaderTitle: 'Alert',
                        okText: 'Ok'
                    })
                }
            }
        }
    }
    

    async GetAllData(){
        var net = await NetInfo.fetch();
        
        if(net.isConnected && net.isInternetReachable){

            await getService(urls.user_category).then((res: any) => {
                if(res){
                    if(res.responseCode == 5001 || res.responseCode == 5002){
                        SendErrorLog('Screen => InspectionCategoryScreen > Method => GetAllData @ api => '+urls.user_category, 'Error While getting user category');
                    }
                }
                if(res.responseCode == 2000){
                    if(res['responseData'].length > 0){
                        DB_Storage.insertUserCategoryData_TBL(res.responseCode == 2000 ? res.responseData : []);
                    }
                }
            }).catch((error) => {
                SendErrorLog('Screen => InspectionCategoryScreen > Method => GetAllData @ api => '+urls.user_category, error.message);
            });

            await getService(urls.inspections).then((res: any) => {
                if(res){
                    if(res.responseCode == 5001 || res.responseCode == 5002){
                        SendErrorLog('Screen => InspectionCategoryScreen > Method => GetAllData @ api => '+urls.inspections, 'Error While getting inspections');
                    }
                }
                if(res.responseCode == 2000){
                    if(res['responseData'].length > 0){
                        DB_Storage.insertInspectionsData_TBL(res.responseCode == 2000 ? res.responseData : []);
                    }
                }
                
            }).catch((error) => {
                SendErrorLog('Screen => InspectionCategoryScreen > Method => GetAllData @ api => '+urls.inspections, error.message);
            });

            await getService(urls.mobile_data).then((res: any) => {
                if(res){
                    if(res.responseCode == 5001 || res.responseCode == 5002){
                        SendErrorLog('Screen => InspectionCategoryScreen > Method => GetAllData @ api => '+urls.mobile_data, 'Error While getting mobile data');
                    }
                }
                if(res.responseCode == 2000){
                    if(res['responseData'].inspections.length > 0){
                        DB_Storage.insertAllMobileData_TBL(res.responseCode == 2000 ? res.responseData.inspections : []);
                    }
                }
                
            }).catch((error) => {
                SendErrorLog('Screen => InspectionCategoryScreen > Method => GetAllData @ api => '+urls.mobile_data, error.message);
            });

            await getService(urls.master_all).then((res: any) => {
                if(res){
                    if(res.responseCode == 5001 || res.responseCode == 5002){
                        SendErrorLog('Screen => InspectionCategoryScreen > Method => GetAllData @ api => '+urls.master_all, 'Error While getting master data');
                    }
                }
                if(res.responseCode == 2000){

                    if(res['responseData']['siteTypes'].length > 0){
                        DB_Storage.runQuery(`Delete from ${DB_Storage.site_type_tbl}`);
                    }
                    if(res['responseData']['sites'].length > 0){
                        DB_Storage.runQuery(`Delete from ${DB_Storage.site_tbl}`);
                    }
                    if(res['responseData']['qCategories'].length > 0){
                        DB_Storage.runQuery(`Delete from ${DB_Storage.question_category_tbl}`);
                    }
                    if(res['responseData']['reasons'].length > 0){
                        DB_Storage.runQuery(`Delete from ${DB_Storage.reasons_tbl}`);
                    }

                    this.props['actions'].allSiteType(res.responseData.siteTypes);
                    DB_Storage.insertSiteTypeData_TBL(res.responseData.siteTypes);
                    DB_Storage.insertSiteData_TBL(res.responseData.sites);
                    DB_Storage.insertQuestionCategoryData_TBL(res.responseData.qCategories);
                    DB_Storage.insertReasonsData_TBL(res.responseData.reasons);
                    DB_Storage.insertDraftData_TBL([]);

                    this.getAllSiteType();
                    this.initializeUserCategory();

                }else{
                    this.props['actions'].allSiteType([]);
                }

                setTimeout(() => {
                    this.setState({
                        spinner: false
                    })
                }, 1000);
                
            }).catch((error) => {
                SendErrorLog('Screen => InspectionCategoryScreen > Method => GetAllData @ api => '+urls.master_all, error.message);
            });
        }else{
            this.props['actions'].allSiteType([]);
            this.getAllSiteType();
            this.setState({
                spinner: false
            });
        }

    }


    async initializeUserCategory(){
        var c_list: any = await DB_Storage.runQuery(`select * from ${DB_Storage.question_category_tbl} order by displayOrder asc`);
        var u_list: any = await DB_Storage.runQuery(`select * from ${DB_Storage.user_category_tbl}`);

        var cat: number[] = JSON.parse(u_list[0]['user_category']);
        var res = c_list.filter((c: any) => cat.includes(c['qCategoryID']));
        res.forEach((r: any) => {
            r['questions'] = [];
        });
        this.props['actions'].setUserCategoryQuestions({data: res});
    }

    getAllSiteType(){
        DB_Storage.runQuery(`select * from ${DB_Storage.site_type_tbl}`).then((res: any) => {
            res.forEach((r: any) => {
                r.icon = {uri: decrypt(urls.domain)+r.icon};
            })
            this.setState({
                site_type: res
            })
        });
    }

    render() {
        const { colorLayout } = this.props as any;
        return (
            <Wrapper
      
                style={{
                    padding: 0,
                }} 
                containerStyle={{
                    padding: 0
                }}
                colorLayout={colorLayout}
                hasHeader={true}
            >
                    <StatusBar
                        backgroundColor={colorLayout.systemHeaderBgColor}
                        barStyle="light-content" translucent={true} 
                    />

                    

                    {
                        this.state.site_type.map((a: any, index) => {
                            return (
                                <View
                                    style={{
                                        marginBottom: (index==this.state.site_type.length-1) ? 30 : 0,
                                    }}
                                    key={a.sTypeID}
                                >
                                    <TouchableOpacity
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            paddingVertical: PADDING_12,
                                            alignItems: 'center',
                                            backgroundColor: '#fff',
                                            paddingHorizontal: PADDING_10,
                                            borderBottomColor: '#d3d3d3',
                                            borderBottomWidth: 1,
                                        }}
                                        onPress={() => {
                                            // (this.props as any).actions.setInspectionStartDateTime({
                                            //     inspectionStartTiming: Date.now()
                                            // });
                                            DB_Storage.runQuery(`DELETE from ${DB_Storage.inspected_survey_tbl}`);
                                            this.props['navigation'].navigate('SiteList', {
                                                props: a
                                            })
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <Image
                                                style={{ ...styles.cat_imag, tintColor: colorLayout['subHeaderBgColor'], display: a.icon ? 'flex' : 'none'}}
                                                source={a.icon} 
                                                onError={() => {
                                                    var site_type = JSON.parse(JSON.stringify(this.state.site_type));
                                                    site_type[index].icon = require('../../../assets/icons/noimage.png')
                                                    this.setState({
                                                        site_type: site_type
                                                    })
                                                }}
                                            />
                                            <Text
                                                style={{
                                                    fontSize: TEXT_SIZE_18,
                                                    fontWeight: '400',
                                                    color: colorLayout['appTextColor'],
                                                    textAlignVertical: 'center',
                                                }}
                                            >
                                                {a.sType}
                                            </Text>
                                        </View>

                                        <Icon
                                            name='angle-right'
                                            type='font-awesome'
                                            color={colorLayout['subHeaderBgColor']}
                                            containerStyle={{
                                                
                                            }}
                                            iconStyle={{
                                                fontSize: TEXT_SIZE_26
                                            }}
                                            
                                        />
                                        
                                    </TouchableOpacity>
                                    {/* <View
                                        style={{
                                            borderBottomColor: '#131313',
                                            borderBottomWidth: 1,
                                            opacity: 0.2,
                                            width: BODY_CONTAINER_WIDTH,
                                            alignSelf: 'center'
                                        }}
                                    /> */}
                                </View>
                            )
                        })
                    }

                {
                    this.state.spinner &&
                    <Spinner
                        visible={true}
                        textContent={''}
                        textStyle={{
                            color: colorLayout['subHeaderBgColor']
                        }}
                        overlayColor={'rgba(0, 0, 0, 0.4)'}
                        color={colorLayout['subHeaderBgColor']}
                        customIndicator={
                            <ActivityIndicator 
                                style={{
                                    opacity: 1,
                                }}
                                size={72}
                                color={colorLayout['subHeaderBgColor']}
                            />
                        }
                    />
                }

                <Message 
                    message={this.state.message} 
                    backgroundColor={'#fff'} 
                    visible={this.state.showMessage}
                    duration={5000}
                    onDismiss={() => {
                        this.setState({
                            showMessage: false
                        }, () => {
                            if(this.state.actionType == 'update'){
                                Linking.openURL(this.state.mAppUrl);
                            }
                        });
                    }}
                    position={'bottom'}
                    headerTitle={this.state.messageModalHeaderTitle}
                    colorLayout={colorLayout}
                    OkText={this.state.okText}
                ></Message>

            </Wrapper>
        );
    }
}

const styles = StyleSheet.create({
    cat_imag: {
        width: 30,
        height: 30,
        tintColor: '#FF3A0A',
    }
});

const mapStateToProps = ({auth}) => {
    return ({
        userData: auth.userData,
        colorLayout: auth.colorLayout,
        allSites: auth.allSites,
        allSiteType: auth.allSiteType,
        totalSyncedSurvey: auth.totalSyncedSurvey,
        updateOfflineSurveyCount: auth.updateOfflineSurveyCount,
        siteId: auth.siteId,
        sTypeId: auth.sTypeId,
        inspectionStartTiming: auth.inspectionStartTiming,
        userCategoryQuestions: auth.userCategoryQuestions
    });
};

const ActionCreators = Object.assign(
    { userData },
    { colorLayout },
    { allSites },
    { allSiteType },
    { totalSyncedSurvey },
    { updateOfflineSurveyCount },
    { setSiteId },
    { setInspectionStartDateTime },
    { setUserCategoryQuestions }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(InspectionCategory);
