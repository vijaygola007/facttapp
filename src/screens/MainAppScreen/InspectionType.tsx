import React, { PureComponent, useRef } from 'react';
import { 
    StyleSheet,
    View,
    Text,
    Dimensions,
    ScrollView,
    TouchableOpacity,
    TouchableHighlight,
    LogBox,
    ActivityIndicator,
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'react-native-elements';
import Spinner from 'react-native-loading-spinner-overlay';
import crashlytics from '@react-native-firebase/crashlytics';
import NetInfo from "@react-native-community/netinfo";


import { Message, AlertComponent } from '../../components/common';
import { userData, setSiteId, setQuestions, setInspection } from '../../store/actions';
import { GenerateRandomString, hexToRgbA } from '../../utilities/constants';
import { getLocalUserData } from '../../utilities/helperFunctions';

// database
import * as storage from '../../db';

// wrappers
import { Wrapper, PADDING_10, APP_PADDING, BORDER_RADIUS, CARD_BORDER_RADIUS,
    TEXT_SIZE_12, TEXT_SIZE_14, TEXT_SIZE_16, TEXT_SIZE_18, TEXT_SIZE_26, SCREEN_WIDTH, BODY_BOX_HEIGHT,
    PADDING_12,
    TEXT_SIZE_20,
    TEXT_SIZE_10,
    TEXT_SIZE_24,
    BTN_BORDER_RADIUS,
    PADDING_14
} from '../../layout/wrapper';
import RNFetchBlob from 'rn-fetch-blob';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const color = {
    danger: '#CD3D3E',
    warning: '#EB9D3E',
    success: '#4DAD49',
    info: '#4CB3D5',
    default: '#565656'
}


class InspectionType extends PureComponent {

    constructor(props) {
        super(props);
    }

    _unsubscribe: any;
    state = {
        registration_code: '',
        showMessage: false,
        visible: false,
        message: '',
        inspection: this.props['route'].params.props,
        categories: [],
        isSurveyDone: 0,
        backgroundColor: '',
        active_category: null,
        spinner: true,
        actionType: '',
        alertMsg: '',
        okText:'Yes',
        cancelText:'No',
        draft: {
            draftId: 0,
            activeQuestionIndex: 0
        },
        selectedIndex: 0,
        draftId: ''
    };

    componentDidMount() {

        this.getAllCategory();
        
        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
        this._unsubscribe = this.props['navigation'].addListener('focus', (e: any) => {
            this.getAllCategory();
        });
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

    async getAllCategory(){
        var inspected_survey: Array<object> = await storage.runQuery(`select * from ${storage.inspected_survey_tbl} where siteID=${(this.props as any).siteId} AND sTypeId=${(this.props as any).sTypeId}`) as Array<object>;

        // storage.runQuery(`select * from ${storage.mobile_data_tbl}`).then((mobile_data: any) => {

            // var all_questions: any = [];
            // mobile_data.forEach((m: any) => {
            //     JSON.parse(m.question).forEach((q: any) => {
            //         all_questions.push(q);
            //     })
            // });

            storage.runQuery(`select * from ${storage.question_category_tbl} order by displayOrder asc`).then((category: any) => {
                
                storage.runQuery(`select * from ${storage.user_category_tbl}`).then((user_category: any) => {
                    var cat: number[] = JSON.parse(user_category[0]['user_category']);
                    var res = category.filter((c: any) => cat.includes(c['qCategoryID']));
                    
                    res.forEach((r: any) => {
                        
                        r['questions'] = [];
                        r['selected'] = false;
                        r['isSurveyCompleted'] = inspected_survey.length > 0 
                        ? 
                        inspected_survey.filter((s: any) => s.qCategoryID == r['qCategoryID']).length > 0
                        ?
                        true 
                        : 
                        false
                        : 
                        false;
                        this.state.inspection.data.question.forEach((q: any) => {
                            if(r['qCategoryID'] == q['qcategoryid']){
                                r['questions'].push(q);
                            }
                        });
                        
                    });
                    
                    var all_categories = res.filter((r: any) => r.questions.length > 0);

                    this.setState({
                        categories: all_categories,
                        isSurveyDone: all_categories.filter((f: any) => f.isSurveyCompleted).length
                    });
                    setTimeout(() => {
                        this.setState({
                            spinner: false
                        })
                    }, 500);

                })
            })
        // })
        
    }

    componentWillUnmount(){
        if(this._unsubscribe){
            this._unsubscribe();
        }
    }

    async uploadSurvey(){
        var net = await NetInfo.fetch();
        if(net.isConnected && net.isInternetReachable){
            var isSurveyCompleted = this.state.categories.filter((f: any) => f.isSurveyCompleted);
            if(this.state.categories.length !== isSurveyCompleted.length){
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

    async getCategoryQuestions(index: number, bypassDraft = false){
        var questions: any = [];
        var draftId = GenerateRandomString(16);
        var categories: any = this.state.categories[index];
        
        var sql = `select * from ${storage.draft_tbl} where inspectionId = ${this.state.inspection['data']['inspectionId']} AND siteId = ${this.state.inspection['siteID']} AND qCategoryID = ${categories['qCategoryID']} AND sTypeId = ${categories['sTypeId']}`;
        
        var draft: any = await storage.runQuery(sql);
        if(draft.length == 0 || bypassDraft == true){
            this.setQuestions(categories['questions']).forEach((ques: any) => {
                questions.push(ques);
            });
            
            var data = JSON.parse(JSON.stringify(this.state.inspection));
            // delete data.data.question;
            data.category = categories;
    
            // if(data.assets){
            //     data.assets.forEach((a: any) => {
            //         a.count = '';
            //         a.comment = '';
            //     });
            // }
    
            var params = {
                inspection: data,
                title: categories['qCategoryName'],
                total_categories: this.state.categories.length,
                trans_no: this.props['route'].params.trans_no,
                draftId: draftId,
                isDraft: false
            };
            this.props['actions'].setQuestions({data: questions});
            this.props['actions'].setInspection({data: params});
            this.props['navigation'].navigate('Question', {
                title: categories['qCategoryName']
            });
        }else{
            draft[0]['questions'] = JSON.parse(draft[0]['questions']);

            var ids: number[] = JSON.parse(JSON.stringify(draft[0]['questions'])).map((m: any) => m.questionID);

            categories['questions'].forEach((q: any, qIndex: number) => {
                if(!ids.includes(q.questionID)){
                    draft[0]['questions'].push(this.setQuestions([q])[0]);
                }
            });

            this.setState({ 
                visible: true,
                actionType: 'draft',
                alertMsg: 'Do you want to start new inspection and remove draft ?',
                okText:'New Inspection',
                cancelText:'With Draft',
                draft: draft[0],
                selectedIndex: index,
                draftId: draft[0]['draftId']
            });
        }
        
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

    render() {
        // this.resetStoreValues(this.props.actions);
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
                        backgroundColor: colorLayout.subHeaderBgColor,
                        paddingHorizontal: APP_PADDING,
                        height: 55,
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}
                >
                    <Text
                        style={{
                            color: colorLayout.headerTextColor,
                            fontSize: 12,
                            fontWeight: '600',
                        }}
                    >
                        ({this.state.inspection ? this.state.inspection.data.scode : ''})
                    </Text>
                    <Text
                        style={{
                            fontSize: 16,
                            color: colorLayout.headerTextColor,
                            fontWeight: '500',
                            textAlignVertical: 'center',
                            width: screenWidth - 24,
                        }}
                    >
                        {this.state.inspection ? this.state.inspection.data.sname : ''}
                    </Text>
                </View>

                <View
                    style={{
                        backgroundColor: colorLayout.cardBgColor,
                        padding: APP_PADDING,
                    }}
                >

                    <Text
                        style={{
                            color: colorLayout.appTextColor,
                            fontSize: TEXT_SIZE_14,
                            fontWeight: '600'
                        }}
                    >
                        ({this.state.inspection ? this.state.inspection.siteCode : ''})
                    </Text>

                    <Text
                        style={{
                            marginTop: 3,
                            fontSize: TEXT_SIZE_16,
                            color: colorLayout.appTextColor,
                            fontWeight: '700'
                        }}
                    >
                        {this.state.inspection ? this.state.inspection.siteName : ''}
                    </Text>

                    <Text
                        style={{
                            fontSize: TEXT_SIZE_12,
                            color: colorLayout.subTextColor,
                            marginTop: 10,
                            fontWeight: '400'
                        }}
                    >
                        {this.state.inspection ? this.state.inspection.siteAddress : ''}
                    </Text>

                </View>

            <ScrollView
                style={styles.container}
                keyboardShouldPersistTaps={'handled'}
                scrollEventThrottle={10000}
            >

                <View
                    style={{
                        flex: 1
                    }}
                >
                    {
                        this.state.categories.map((a: any, index) => {
                            return (
                                <View key={index}>
                                    <TouchableHighlight 
                                    
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            borderBottomColor: '#d3d3d3',
                                            borderBottomWidth: 1,
                                        }}
                                        onPress={() => {
                                            // var data = JSON.parse(JSON.stringify(this.state.inspection));
                                            // delete data.data.question;
                                            // data.category = a;

                                            // if(data.assets){
                                            //     data.assets.forEach((a: any) => {
                                            //         a.count = '';
                                            //         a.comment = '';
                                            //     });
                                            // }

                                            if(!a.isSurveyCompleted){
                                                this.getCategoryQuestions(index);
                                            }else{
                                                this.setState({
                                                    showMessage: true,
                                                    backgroundColor: color.success,
                                                    message: `Survey for '${a.qCategoryName}' has been completed`,
                                                });
                                                setTimeout(function () {
                                                    this.setState({showMessage: false});
                                                }.bind(this), 5000);
                                            }
                                            
                                        }}
                                        underlayColor={hexToRgbA(colorLayout.cardBgColor, '0.4')}
                                        onShowUnderlay={()=>{
                                            this.setState({
                                                active_category: a.qCategoryID
                                            })
                                        }}
                                        onHideUnderlay={() => {
                                            this.setState({
                                                active_category: null
                                            })
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                flex: 1,
                                                paddingHorizontal: PADDING_10,
                                                paddingVertical: PADDING_12,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    alignSelf: 'center',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <Icon
                                                    name='checkmark-outline'
                                                    type='ionicon'
                                                    color={a.isSurveyCompleted ? colorLayout.appTextColor : a.qCategoryID == this.state.active_category ? colorLayout.cardBgColor : colorLayout.cardBgColor}
                                                    containerStyle={{
                                                        marginRight: 5,
                                                    }}
                                                    iconStyle={{
                                                        fontSize: TEXT_SIZE_26,
                                                        marginLeft: -5
                                                    }}
                                                    
                                                />
                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_18,
                                                        fontWeight: '400',
                                                        color: colorLayout['appTextColor'],
                                                    }}
                                                >
                                                    {a.qCategoryName}
                                                </Text>
                                            </View>

                                            <Icon
                                                name='angle-right'
                                                type='font-awesome'
                                                color={a.qCategoryID == this.state.active_category ? colorLayout.subHeaderBgColor : colorLayout.subHeaderBgColor}
                                                containerStyle={{
                                                    alignSelf: 'center'
                                                }}
                                                iconStyle={{
                                                    fontSize: TEXT_SIZE_26
                                                }}
                                                
                                            />
                                        </View>

                                    </TouchableHighlight>
                                </View>
                            );
                        })
                    }
                </View>

            </ScrollView>

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
                        opacity: this.state.isSurveyDone > 0 ? 1 : 0.6,
                    }}
                    onPress={() => {
                        this.uploadSurvey();
                       
                    }}
                    disabled={this.state.isSurveyDone > 0 ? false : true}
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
                colorLayout={colorLayout}
            ></Message>

            <AlertComponent 
                message={this.state.alertMsg} 
                visible={this.state.visible}
                onCancel={() => {
                    this.setState({
                        visible: false
                    }, () => {
                        if(this.state.actionType == 'draft'){
                            var data = JSON.parse(JSON.stringify(this.state.inspection));
                            var categories = this.state.categories[this.state.selectedIndex];
                            data.category = categories;
                            data.activeQuestionIndex = this.state.draft.activeQuestionIndex;

                            var draftId: any = this.state.draft ? this.state.draft.draftId : 0;
                            var ques: any = this.state.draft ? this.state.draft['questions'] : [];

                            var params = {
                                inspection: data,
                                title: data.category['qCategoryName'],
                                trans_no: this.props['route'].params.trans_no,
                                isDraft: true,
                                draftId: draftId
                            };
                            this.props['actions'].setQuestions({data: ques});
                            this.props['actions'].setInspection({data: params});
                            this.props['navigation'].navigate('Question', {
                                title: data.category['qCategoryName']
                            });
                        }
                    });
                }}
                onOk={() => {
                    this.setState({ visible: false }, async () => {
                        if(this.state.actionType == 'upload'){
                            this.props['navigation'].navigate('SyncData');
                        }
                        if(this.state.actionType == 'draft'){
                            await storage.runQuery(`delete from ${storage.draft_tbl} where draftId='${this.state.draftId}'`);
                            await storage.runQuery(`delete from ${storage.draft_tbl} where inspectionId='${this.props['inspection']['inspection']['inspectionId']}' AND siteId='${this.props['inspection']['inspection']['siteID']}' AND qCategoryID='${this.state.categories[this.state.selectedIndex]['qCategoryID']}'`);
                            this.getCategoryQuestions(this.state.selectedIndex, true);
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


                {/* <Connectivity {...this.props} /> */}

            </Wrapper>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginBottom: 0,
        backgroundColor: '#ffffff'
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
        marginLeft: 10
    }
});

const mapStateToProps = ({auth}) => {
    return ({
        userData: auth.userData,
        colorLayout: auth.colorLayout,
        siteId: auth.siteId,
        sTypeId: auth.sTypeId,
        questions: auth.questions,
        inspection: auth.inspection,
        userCategoryQuestions: auth.userCategoryQuestions
    });
};

const ActionCreators = Object.assign(
    { userData },
    { setSiteId },
    { setQuestions },
    { setInspection }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(InspectionType);
