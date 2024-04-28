import React, { PureComponent } from 'react';
import { 
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    LogBox,
    ActivityIndicator
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'react-native-elements';
import { TextInput } from 'react-native-paper';
import Spinner from 'react-native-loading-spinner-overlay';
import crashlytics from '@react-native-firebase/crashlytics';
import NetInfo from "@react-native-community/netinfo";


import { userData, setInspection, setQuestions } from '../../store/actions';

// database
import * as storage from '../../db';

import { AlertComponent, Message } from '../../components/common';
import { GenerateRandomString, hexToRgbA } from '../../utilities/constants';
import { getLocalUserData } from '../../utilities/helperFunctions';


// wrappers
import { Wrapper, PADDING_10, APP_PADDING, BORDER_RADIUS, CARD_BORDER_RADIUS,
    TEXT_SIZE_12, TEXT_SIZE_14, TEXT_SIZE_16, TEXT_SIZE_18, TEXT_SIZE_26, SCREEN_WIDTH, BODY_BOX_HEIGHT,
    PADDING_12,
    TEXT_SIZE_20,
    TEXT_SIZE_10,
    TEXT_SIZE_24,
    PADDING_14,
    BTN_BORDER_RADIUS
} from '../../layout/wrapper';

class InspectionsList extends PureComponent {

    state = {
        registration_code: '',
        showMessage: false,
        message: '',
        inspection_list: [],
        inspection: this.props['route'].params.props,
        search_text: '',
        spinner: true,
        trans_no: '',
        selectedIndex: 0,
        actionType: '',
        alertMsg: '',
        okText:'Yes',
        cancelText:'No',
        visible: false,
        completedSurveyCount: 0,
        draftId: ''
    };

    componentDidMount() {
        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
        this.initialize();
        this.props['navigation'].addListener('focus', (e: any) => {
           this.initialize();
        });
    }

    async initialize(){
        this.createTransactionNo();

        // var inspected_survey: Array<object> = await storage.runQuery(`select * from ${storage.inspected_survey_tbl} where siteID=${(this.props as any).siteId} AND sTypeId=${(this.props as any).sTypeId}`) as Array<object>;
        // var inspected_survey: Array<object> = await storage.runQuery(`select * from ${storage.inspected_survey_tbl}`) as Array<object>;

        var sql = `select * from ${storage.mobile_data_tbl} where stypeId = ${this.state.inspection['sTypeId']}`;
        storage.runQuery(sql).then(async (res: any) => {
            // res.forEach((r: object) => {
            //     r['is_visible'] = true;
            //     r['question'] = JSON.parse(r['question']);
            // });
            for (const element of res){
                element['is_visible'] = true;
                element['question'] = JSON.parse(element['question']);

                var survey_sql = `select * from ${storage.inspected_survey_tbl} where inspectionId=${element['inspectionId']}`;
                var survey: any = await storage.runQuery(survey_sql);

                element['isSurveySaved'] = survey.length > 0 ? true : false;
                if(element['isSurveySaved'] == true){
                    this.setState({
                        completedSurveyCount: 1
                    })
                }
            }
            setTimeout(() => {
                this.setState({
                    inspection_list: res,
                    spinner: false
                });
            }, 500);
        });
    }

    createTransactionNo(){
        var dt = new Date();

        var txn_date = dt.getUTCDate() > 9 ? dt.getUTCDate() : '0'+dt.getUTCDate();
        txn_date += '-'+(dt.getUTCMonth() > 8 ? (dt.getUTCMonth() + 1) : '0'+(dt.getUTCMonth() + 1));
        txn_date += '-'+dt.getUTCFullYear();
        
        var time = (dt.getUTCHours() > 9 ? dt.getUTCHours() : '0'+dt.getUTCHours())+':'+(dt.getUTCMinutes() > 9 ? dt.getUTCMinutes() : '0'+dt.getUTCMinutes())+':'+(dt.getUTCSeconds() > 9 ? dt.getUTCSeconds() : '0'+dt.getUTCSeconds());
        var transactionNo = (txn_date as string).split('-').join('')+''+(time as string).split(':').join('');

        this.setState({
            trans_no: transactionNo
        });
    }

    search_sites(value: string){
        this.setState({
            search_text: value
        });
        var filter = JSON.parse(JSON.stringify(this.state.inspection_list));
        filter.forEach((s: object) => {
            if(s['sname'].toLowerCase().includes(value.toLowerCase().trim()) || s['scode'].toLowerCase().includes(value.toLowerCase().trim())){
                s['is_visible'] = true;
            }else{
                s['is_visible'] = false;
            }
        });
        this.setState({
            inspection_list: filter
        });
    }

    componentWillUnmount(){

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

    async getAllCategory(data: any){
        if(!this.state.trans_no){
            this.createTransactionNo();
            this.getAllCategory(data);
            return;
        }
        var userdata: any = await getLocalUserData();
        
        if(userdata.isCategoryScreenEnable == true){
            storage.runQuery(`select * from ${storage.question_category_tbl}`).then((category: any) => {
                storage.runQuery(`select * from ${storage.user_category_tbl}`).then((user_category: any) => {
                    var cat: number[] = JSON.parse(user_category[0]['user_category']);
                    var res = category.filter((c: any) => cat.includes(c['qCategoryID']));
    
                    res.forEach((r: any) => {
                        r['questions'] = [];
                        data.question.forEach((q: any) => {
                            if(r['qCategoryID'] == q['qcategoryid']){
                                r['questions'].push(q);
                            }
                        })
                    });
                    
    
                    var all_categories = res.filter((r: any) => r.questions.length > 0);
                    this.state.inspection.data = data;
    
                    this.props['navigation'].navigate('InspectionType', {
                        props: this.state.inspection,
                        total_category: all_categories.length,
                        trans_no: this.state.trans_no
                    });
    
                });
            });
        }else{
            this.setInspection(data);
        }
    }

    async setInspection(data: any, bypassDraft = false){
        var sql = `select * from ${storage.draft_tbl} d inner join ${storage.site_tbl} s on d.siteId = s.siteID where d.inspectionId='${data['inspectionId']}' AND d.siteId='${this.state.inspection['siteID']}'`;
        var draftList: any = await storage.runQuery(sql);
        
        if(draftList.length == 0 || bypassDraft == true){

            var ic = JSON.parse(JSON.stringify(data));
            var inspection = JSON.parse(JSON.stringify(this.state.inspection));
            inspection.data = ic;
            var questions = this.setQuestions(ic.question);

            var draftId = GenerateRandomString(16);
            var params = {
                inspection: inspection,
                title: data.sname,
                total_categories: this.state.inspection_list.length,
                trans_no: this.state.trans_no,
                isDraft: false,
                draftId: draftId
            };

            this.props['actions'].setQuestions({data: questions});
            this.props['actions'].setInspection({data: params});
            this.props['navigation'].navigate('Question', {
                title: data.sname
            });
        }else{
            this.setState({ 
                visible: true,
                actionType: 'draft',
                alertMsg: 'Do you want to start new inspection and remove draft ?',
                okText:'New Inspection',
                cancelText:'With Draft',
                selectedIndex: this.state.selectedIndex,
                draftId: draftList[0]['draftId']
            });

        }
    }

    async getDraftRecordForInspection(data: any){
        var sql = `select * from ${storage.draft_tbl} d inner join ${storage.site_tbl} s on d.siteId = s.siteID where d.inspectionId='${data['inspectionId']}' AND d.siteId='${this.props['siteData']['siteID']}'`;
        // sql = `select * from ${storage.draft_tbl} where draftId='${this.state.draftId}'`;
        
        var draftList: any = await storage.runQuery(sql);
        var qids: number[] = []; 
        var questionList: Array<any> = [];
        data.question = this.setQuestions(data.question);
        var categoryList: Array<any> = [];

        for (const element of draftList) {
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
            categoryList.push(element['category']);
        }
        data['question'].forEach((qlist: any) => {
            if(!qids.includes(qlist.questionID)){
                questionList.push(qlist);
            }
        });
        
        draftList[0]['data'] = data;
        var param: any = {
            inspection: draftList[0],
            title: data.sname,
            total_categories: this.state.inspection_list.length,
            trans_no: draftList[0]['transactionNo'],
            isDraft: true,
            draftId: draftList[0]['draftId']
        };

        this.props['actions'].setQuestions({data: questionList});
        this.props['actions'].setInspection({data: param});
        this.props['navigation'].navigate('Question', {
            title: data.sname
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


    setQuestions(categoryQuestions: any){
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
                if(this.state.inspection.assets.length > 0){
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

    async uploadSurvey(){
        var net = await NetInfo.fetch();
        if(net.isConnected && net.isInternetReachable){
            var isSurveyCompleted = this.state.inspection_list.filter((f: any) => f.isSurveySaved);
            if(this.state.inspection_list.length !== isSurveyCompleted.length){
                this.setState({ 
                    visible: true,
                    actionType: 'upload',
                    alertMsg: 'Inspection is "incomplete". Do you want to upload data on server ?',
                    okText:'Yes',
                    cancelText:'No'
                });
            }else{
                this.props['navigation'].navigate('SyncData');
            }
        }else{
            this.setState({
                showMessage: true,
                message: `internet connection is not available`,
            });
        }
    }

    render() {
        const { colorLayout } = this.props as any;
        
        return (
            <Wrapper
      
                containerStyle={{
                    padding: 0
                }}
                colorLayout={colorLayout}
                hasHeader={true}
                scrollEnabled={false}
                disableKeyboardBottom={false}
            >
                
                <View
                    style={{
                        height: 75,
                        width: SCREEN_WIDTH,
                        backgroundColor: colorLayout.cardBgColor,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        zIndex: 1,
                        paddingHorizontal: APP_PADDING
                    }}
                >
                    
                    <TextInput
                        label="Search"
                        mode={'outlined'}
                        style={{
                            height: 35,
                            backgroundColor: '#fff',
                            flex: 1
                        }}
                        right={
                            <TextInput.Icon 
                                name={() => <Icon 
                                    name={'search'} 
                                    size={24} 
                                    color={colorLayout.subHeaderBgColor} 
                                    
                                />}
                                style={{
                                    marginTop: 16,
                                }}
                            />
                        }
                        theme={{
                            colors: {
                                primary: this.state.search_text ? colorLayout.subHeaderBgColor : colorLayout.subHeaderBgColor
                            }
                        }}
                        outlineColor={colorLayout.subHeaderBgColor}
                        value={this.state.search_text}
                        onChangeText={text => this.search_sites(text)}
                    />

                </View>
                {
                    this.state.inspection_list.length == 0 && !this.state.spinner &&
                    <View>
                        <Image
                            style={{ width: SCREEN_WIDTH, height: 90, marginTop: 200}}
                            source={require('../../../assets/img/no_inspection_site.png')} 
                            resizeMode={'contain'}
                        />

                        <Text style={{color: colorLayout.appTextColor, textAlign: 'center', marginTop: 10}}>No Inspections</Text>
                    </View>
                }

                {
                    this.state.inspection_list.length > 0 && this.state.search_text ? true : false &&
                    <View>
                        <Image
                            style={{ width: SCREEN_WIDTH, height: 90, marginTop: 200}}
                            source={require('../../../assets/img/no_inspection_site.png')} 
                            resizeMode={'contain'}
                        />

                        <Text style={{color: colorLayout.appTextColor, textAlign: 'center', marginTop: 10}}>No Inspections</Text>
                    </View>
                }

                {
                    this.state.inspection_list.length == 0 && this.state.spinner &&
                    <View>
                        <Text
                            style={{
                                textAlign: 'center',
                                marginTop: 20,
                                fontSize: TEXT_SIZE_18
                            }}
                        >
                            Inspections loading...
                        </Text>
                    </View>
                }

                {
                    this.state.inspection_list.length > 0 &&
                    <ScrollView
                        style={{
                            backgroundColor: colorLayout.appBgColor,
                        }}
                        onScroll={(event) => {
                            
                        }}
                        scrollEventThrottle={10000}
                        scrollEnabled={true}
                    >
                        {
                            this.state.inspection_list.map((a, index) => {
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
                                            display: a['is_visible'] ? 'flex' : 'none',
                                            backgroundColor: colorLayout.appBgColor,
                                        }}
                                        onPress={() => {
                                            if(this.props['userData']['isCategoryScreenEnable'] == false){
                                                if(a['isSurveySaved'] == true){
                                                    this.setState({
                                                        showMessage: true,
                                                        message: `Survey for '${a['sname']}' has been completed`
                                                    })
                                                }else{
                                                    this.setState({
                                                        selectedIndex: index
                                                    }, () => {
                                                        this.getAllCategory(a);
                                                    });
                                                }
                                            }else{
                                                this.setState({
                                                    selectedIndex: index
                                                }, () => {
                                                    this.getAllCategory(a);
                                                });
                                            }
                                            
                                        }}
                                        activeOpacity={0.9}
                                    >
                                        <View>
                                            <Text
                                                style={{
                                                    fontSize: TEXT_SIZE_12,
                                                    color: colorLayout.appTextColor,
                                                    fontWeight: '400',
                                                    textAlignVertical: 'center'
                                                }}
                                            >
                                                ({a['scode']})
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: TEXT_SIZE_16,
                                                    color: colorLayout.appTextColor,
                                                    fontWeight: '400',
                                                    marginTop: 4,
                                                    textAlignVertical: 'center'
                                                }}
                                            >
                                                {a['sname']}
                                            </Text>
                                        </View>

                                        <View
                                            style={{
                                                flexDirection: 'row'
                                            }}
                                        >
                                            {
                                                a['isSurveySaved'] && this.props['userData']['isCategoryScreenEnable'] == false &&
                                                <Icon
                                                    name='checkmark-circle'
                                                    type='ionicon'
                                                    color="#228B22"
                                                    containerStyle={{
                                                        alignSelf: 'center',
                                                        marginRight: APP_PADDING
                                                    }}
                                                    iconStyle={{
                                                        fontSize: 24,
                                                    }}
                                                /> 
                                            }
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
                                        </View>

                                    </TouchableOpacity>
                                );
                            })
                        }
                    </ScrollView>
                }

                {
                    this.props['userData']['isCategoryScreenEnable'] == false && this.state.spinner == false &&
                    <View
                        style={{
                            backgroundColor: colorLayout.appBgColor,
                            flexDirection: 'column',
                            padding: APP_PADDING,
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                backgroundColor: colorLayout.headerBgColor,
                                paddingVertical: PADDING_14,
                                borderRadius: BTN_BORDER_RADIUS,
                                opacity: this.state.completedSurveyCount > 0 ? 1 : 0.6,
                            }}
                            onPress={() => {
                                this.uploadSurvey();
                            }}
                            disabled={this.state.completedSurveyCount > 0 ? false : true}
                        >
                            <Text
                                style={{
                                    color: colorLayout['headerTextColor'],
                                    fontSize: TEXT_SIZE_16,
                                    textAlignVertical: 'center',
                                    fontWeight: '500',
                                    textAlign: 'center'
                                }}
                            >
                                Done
                            </Text>
                        </TouchableOpacity>
                    </View>
                }

                <Message 
                    message={this.state.message} 
                    visible={this.state.showMessage}
                    duration={5000}
                    onDismiss={() => {
                        this.setState({
                            showMessage: false
                        });
                    }}
                    colorLayout={colorLayout}
                    showOk={true}
                    OkText={'Ok'}
                ></Message>

                <AlertComponent 
                    message={this.state.alertMsg} 
                    visible={this.state.visible}
                    showCloseBtn={true}
                    onClose={() => {
                        this.setState({
                            visible: false,
                        });
                    }}
                    onCancel={() => {
                        this.setState({
                            visible: false
                        }, () => {
                            if(this.state.actionType == 'draft'){
                                this.getDraftRecordForInspection(this.state.inspection_list[this.state.selectedIndex]);
                            }
                        });
                    }}
                    onOk={() => {
                        this.setState({ visible: false }, async () => {
                            if(this.state.actionType == 'draft'){
                                await storage.runQuery(`delete from ${storage.draft_tbl} where draftId='${this.state.draftId}'`);
                                await storage.runQuery(`delete from ${storage.draft_tbl} where inspectionId='${this.state.inspection_list[this.state.selectedIndex]['inspectionId']}' AND siteId='${this.state.inspection['siteID']}'`);
                                this.setInspection(this.state.inspection_list[this.state.selectedIndex], true);
                            }
                            if(this.state.actionType == 'upload'){
                                this.props['navigation'].navigate('SyncData');
                            }
                        });
                    }}
                    headerTitle={'Confirmation'}
                    okText={this.state.okText}
                    cancelText={this.state.cancelText}
                ></AlertComponent>

                
                {
                    this.state.spinner &&
                    <Spinner
                        visible={true}
                        textContent={''}
                        textStyle={{
                            color: colorLayout['headerBgColor']
                        }}
                        overlayColor={hexToRgbA(colorLayout['appBgColor'])}
                        color={colorLayout['headerBgColor']}
                        indicatorStyle={{

                        }}
                        customIndicator={
                            <ActivityIndicator 
                                style={{
                                    opacity: 1
                                }}
                                size={100}
                                color={colorLayout['headerBgColor']}
                            />
                        }
                    />
                }

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
        userCategoryQuestions: auth.userCategoryQuestions,
        siteData: auth.siteData
    });
};

const ActionCreators = Object.assign(
    { userData },
    { setInspection },
    { setQuestions }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(InspectionsList);
