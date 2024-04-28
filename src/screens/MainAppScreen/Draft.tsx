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
    Platform,
    ScrollView
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'react-native-elements';
import Spinner from 'react-native-loading-spinner-overlay';
import NetInfo from "@react-native-community/netinfo";
import crashlytics from '@react-native-firebase/crashlytics';
import { getVersion } from 'react-native-device-info';
import Geolocation from 'react-native-geolocation-service';

import { userData, colorLayout, setQuestions, setInspection, setSelectedSite } from '../../store/actions';

// database
import * as storage from '../../db';

import { urls, decrypt, encrypt, MONTH_NAME, MONTH_INDEX } from '../../utilities/constants';
import { getService, SendErrorLog, postFormDataService } from '../../api-services';
import { getTotalSyncedSurvey } from '../../utilities/helperFunctions';

import { getLocalUserData, getRegistrationData } from '../../utilities/helperFunctions';

import { 
    Message,
} from '../../components/common';
// wrappers
import { Wrapper, ContentWrapper2, TEXT_SIZE_18, TEXT_SIZE_26, BODY_CONTAINER_WIDTH,
    PADDING_12, PADDING_10, HEADER_HEIGHT, SCREEN_HEIGHT, APP_PADDING, BODY_CONTAINER_HEIGHT,
    TEXT_SIZE_16,
    TEXT_SIZE_12,
    TEXT_SIZE_10
} from '../../layout/wrapper';
import RNFetchBlob from 'rn-fetch-blob';


import { utils } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

class Draft extends PureComponent {

    _unsubscribe: any;
    _state_subscribe: any;

    constructor(props) {
        super(props);
    }

    state = {
        draftList: [],
    };

    _netunsubscribe: any;
    componentDidMount() {
        this.fetchAllDraft();
        this.props['navigation'].addListener('focus', (e: any) => {
            this.fetchAllDraft();
        });
    }

    async fetchAllDraft(){
        var sql = '';
        if(this.props['userData']['isCategoryScreenEnable'] == true){
            sql = `select d.*, s.*, m.sname as sname, q.qCategoryName as qCategoryName from ${storage.draft_tbl} d 
            inner join ${storage.site_tbl} s on d.siteId = s.siteID 
            inner join ${storage.mobile_data_tbl} m on d.inspectionId = m.inspectionId 
            inner join ${storage.question_category_tbl} q on d.qCategoryID = q.qCategoryID`;
        }else{
            sql = `select d.*, s.*, m.sname as sname, q.qCategoryName as qCategoryName from ${storage.draft_tbl} d 
            inner join ${storage.site_tbl} s on d.siteId = s.siteID 
            inner join ${storage.mobile_data_tbl} m on d.inspectionId = m.inspectionId 
            inner join ${storage.question_category_tbl} q on d.qCategoryID = q.qCategoryID
            GROUP BY draftId`;
            // sql = `select d.*, s.*, m.sname as sname, q.qCategoryName as qCategoryName from (SELECT * FROM ${storage.draft_tbl} ORDER BY createdDate DESC) AS d 
            // inner join ${storage.site_tbl} s on d.siteId = s.siteID 
            // inner join ${storage.mobile_data_tbl} m on d.inspectionId = m.inspectionId 
            // inner join ${storage.question_category_tbl} q on d.qCategoryID = q.qCategoryID
            // GROUP BY d.siteId, d.inspectionId`;
        }
        
        var drafts: any = await storage.runQuery(sql);
        // for (const element of drafts) {
        // //     element['questions'] = JSON.parse(element['questions']);
        // //     element['assets'] = JSON.parse(element['assets']);
        //     // var category = await this.getCategoryData(element['qCategoryID']);
        //     var inspectionList = await this.getInspectionData(element['inspectionId']);
        //     // var inspectionList = await this.getInspectionData(element['inspectionId'], category[0]['qCategoryID']);
        //     element['data'] = inspectionList[0];
        // //     element['category'] = category[0];
        // //     var percentage = (100/element['questions'].length)*element['activeQuestionIndex'];
        // //     element['percentage'] = percentage.toFixed(0);
        // }
        this.setState({
            draftList: drafts
        });
    }

    async getInspectionData(inspectionId: number, qCategoryID: number){
        var isql = `select * from ${storage.mobile_data_tbl} where inspectionId = ${inspectionId}`;
        var inspectionList: any = await storage.runQuery(isql);
        inspectionList.forEach((r: object) => {
            r['question'] = (JSON.parse(r['question'])).filter((q: any) => q.qcategoryid == qCategoryID);
        });
        return inspectionList;
    }
    
    async getCategoryData(qCategoryID: number){
        var category: any = await storage.runQuery(`select * from ${storage.question_category_tbl} where qCategoryID = ${qCategoryID}`);
        return category;
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

    async editDraft(draft: any){
        var sql = '';
        if(this.props['userData']['isCategoryScreenEnable'] == true){
            sql = `select * from ${storage.draft_tbl} d inner join ${storage.site_tbl} s on d.siteId = s.siteID where draftId='${draft['draftId']}' AND qCategoryID=${draft['qCategoryID']}`;
        }else{
            sql = `select * from ${storage.draft_tbl} d inner join ${storage.site_tbl} s on d.siteId = s.siteID where draftId='${draft['draftId']}'`;
        }
        var drafts: any = await storage.runQuery(sql);


        var qids: number[] = []; 
        var questionList: Array<any> = [];
        var inspectionId = 0;

        for (const element of drafts) {
            element['questions'] = JSON.parse(element['questions']);
            element['assets'] = JSON.parse(element['assets']);
            var category = await this.getCategoryData(element['qCategoryID']);

            var inspectionList = await this.getInspectionData(element['inspectionId'], category[0]['qCategoryID']);
            element['data'] = inspectionList[0];
            element['category'] = category[0];
            element['questions'].forEach((q: any) => {
                qids.push(q['questionID']);
                questionList.push(q);
            });
            inspectionId = element['inspectionId'];
        }
        var qsql = `select * from ${storage.mobile_data_tbl} where inspectionId = ${inspectionId}`;
        var list: any = await storage.runQuery(qsql);
        var inspectionsQuestionList: Array<object> = JSON.parse(list[0]['question']);

        list[0]['question'] = this.setQuestions(this.props['userData']['isCategoryScreenEnable'] == true ? inspectionsQuestionList.filter((f: any) => f.qcategoryid == draft['qCategoryID']) : inspectionsQuestionList, draft);

        list[0]['question'].forEach((qlist: any) => {
            if(!qids.includes(qlist.questionID)){
                questionList.push(qlist);
            }
        });

        draft['data'] = list[0];


        var siteData = {
            assets: drafts[0]['assets'],
            icon: drafts[0]['icon'],
            is_visible: drafts[0]['is_visible'],
            lastAuditedOn: drafts[0]['lastAuditedOn'],
            sType: drafts[0]['sType'],
            sTypeId: drafts[0]['sTypeId'],
            siteAddress: drafts[0]['siteAddress'],
            siteCode: drafts[0]['siteCode'],
            siteID: drafts[0]['siteID'],
            siteLat: drafts[0]['siteLat'],
            siteLog: drafts[0]['siteLog'],
            siteName: drafts[0]['siteName']
        };

        var params = {
            inspection: draft,
            title: this.props['userData']['isCategoryScreenEnable'] == true ? draft['qCategoryName'] : draft['sname'],
            trans_no: draft.transactionNo,
            draftId: draft.draftId,
            isDraft: true
        };
        
        // var data = JSON.parse(JSON.stringify(draft));
        // var questions = this.setQuestions(data['data']['question'], data);
        // var ids: number[] = data.questions.map((m: any) => m.questionID);

        // data['data']['question'] = questions;
        // questions.forEach((q: any, qIndex: number) => {
        //     if(!ids.includes(q.questionID)){
        //         data.questions.push(q);
        //     }
        // });
        
        this.props['actions'].setSelectedSite({data: siteData});
        this.props['actions'].setQuestions({data: questionList});
        this.props['actions'].setInspection({data: params});
        this.props['navigation'].navigate('Question', {
            title: this.props['userData']['isCategoryScreenEnable'] == true ? draft['qCategoryName'] : draft['sname']
        });
    }

    setQuestions(categoryQuestions: any, inspection: any){
        var questions: any = [];
        categoryQuestions.forEach((q: any, q_index: number) => {
            q['willShowComment'] = q['comment'];
            q['selected_choice'] = null;
            q['audio'] = [];
            q['video'] = [];
            q['photo'] = [];
            q['reason'] = [];
            q['comment'] = '';
            q['audioLength'] = 0;
            q['videoLength'] = 0;
            q['recordingSaved'] = false;
            q['videoSaved'] = false;
            q['imagesSaved'] = false;
            
            if(q.choice){
                q.choice.forEach((c: any) => {
                    c.selected = false;
                })
            }
            if(q['qtype'].trim().toLowerCase() == 'aq'){
                if(inspection.assets.length > 0){
                    questions.push(q);
                }
            }
            else if(q['qtype'].trim().toLowerCase() == 'mo'){
                q.choice.map(a => a.ctext).forEach((reason, reason_index) => {
                    q['reason'].push({
                        reasonID: reason_index+1,
                        reasonText: reason,
                        tags: reason,
                        reason: reason,
                        selected: false
                    })
                });
                q.choice = null;
                questions.push(q);
            }
            else{
                questions.push(q);
            }
        });
        return questions;
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
                {
                    this.state.draftList.length == 0 &&
                    <View
                        style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Image
                            style={{ 
                                
                            }}
                            source={require('../../../assets/images/no-data.jpg')} 
                            resizeMode={'cover'}
                        />
                    </View>   
                }
                 <ScrollView
                        style={{
                            backgroundColor: colorLayout.appBgColor,
                            display: this.state.draftList.length == 0 ? 'none' : 'flex'
                            // height: BODY_BOX_HEIGHT,
                        }}
                        onScroll={(event) => {
                            
                        }}
                        scrollEventThrottle={10000}
                        scrollEnabled={true}
                    >
                        {
                            this.state.draftList.map((a, index) => {
                                return (
                                    <TouchableOpacity 
                                        key={index}
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            paddingHorizontal: PADDING_10,
                                            paddingVertical: PADDING_12,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#d3d3d3',
                                            backgroundColor: colorLayout.appBgColor,
                                        }}
                                        onPress={() => {
                                            this.editDraft(a);
                                        }}
                                        activeOpacity={0.9}
                                    >
                                        <View
                                            style={{
                                                flex: 1
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: TEXT_SIZE_12,
                                                    color: colorLayout.appTextColor,
                                                    fontWeight: '400',
                                                    textAlignVertical: 'center'
                                                }}
                                            >
                                                ({a['siteCode']})
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: TEXT_SIZE_16,
                                                    color: colorLayout.appTextColor,
                                                    fontWeight: '400',
                                                    marginTop: 4,
                                                    textAlignVertical: 'center',
                                                    marginLeft: -5
                                                }}
                                            >
                                                {a['siteName']} {this.props['userData']['isCategoryScreenEnable'] == true ? ` (${a['qCategoryName']})` : null}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: TEXT_SIZE_16,
                                                    color: colorLayout.appTextColor,
                                                    fontWeight: '400',
                                                    marginTop: 0,
                                                    textAlignVertical: 'center',
                                                }}
                                            >
                                                {a['sname']}
                                            </Text>
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    flex: 1,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_10,
                                                        color: colorLayout.appTextColor,
                                                        fontWeight: '400',
                                                        marginTop: 4,
                                                        textAlignVertical: 'center'
                                                    }}
                                                >
                                                    {a['createdDate']}
                                                </Text>
                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_10,
                                                        color: colorLayout.appTextColor,
                                                        fontWeight: '400',
                                                        marginTop: 4,
                                                        textAlignVertical: 'center',
                                                        marginRight: -APP_PADDING
                                                    }}
                                                >
                                                    {/* {a['percentage']}% Completed */}
                                                </Text>
                                            </View>
                                        </View>

                                        <Icon
                                            name={'angle-right'}
                                            type={'font-awesome'}
                                            color={colorLayout.subHeaderBgColor}
                                            containerStyle={{
                                                alignSelf: 'center'
                                            }}
                                            iconStyle={{
                                                fontSize: TEXT_SIZE_26
                                            }}
                                            
                                        />

                                    </TouchableOpacity>
                                );
                            })
                        }
                    </ScrollView>

            </Wrapper>
        );
    }

}

const styles = StyleSheet.create({
    
});

const mapStateToProps = ({auth}) => {
    return ({
        userData: auth.userData,
        colorLayout: auth.colorLayout,
    });
};

const ActionCreators = Object.assign(
    { userData },
    { colorLayout },
    { setQuestions },
    { setInspection },
    { setSelectedSite }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Draft);
