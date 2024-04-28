import React, { PureComponent, useRef } from 'react';
import { 
    StyleSheet,
    View,
    Text,
    Dimensions,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    LogBox,
    TextInput as TextInputR,
    Platform
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Geolocation from 'react-native-geolocation-service';

import crashlytics from '@react-native-firebase/crashlytics';

import { userData, updateOfflineSurveyCount, setSiteId } from '../../store/actions';

// database
import * as storage from '../../db';
import { MONTH_NAME } from '../../utilities/constants';

import { AlertComponent, Connectivity } from '../../components/common';
import { getLocalUserData } from '../../utilities/helperFunctions';


// wrappers
import { Wrapper, PADDING_10, APP_PADDING, BORDER_RADIUS, CARD_BORDER_RADIUS,
    TEXT_SIZE_12, TEXT_SIZE_14, TEXT_SIZE_16, TEXT_SIZE_18, TEXT_SIZE_26, SCREEN_WIDTH, BODY_BOX_HEIGHT,
    PADDING_12,
    TEXT_SIZE_20,
    TEXT_SIZE_10,
    TEXT_SIZE_24,
    BTN_BORDER_RADIUS,
    PADDING_14,
    PADDING_16,
    PADDING_6
} from '../../layout/wrapper';

const screenWidth = Dimensions.get('screen').width;
const screenHeight = Dimensions.get('screen').height;


class Confirmation extends PureComponent {

    constructor(props) {
        super(props);
    }

    state = {
        registration_code: '',
        showMessage: false,
        visible: false,
        message: '',
        inspection: this.props['inspectedSurvey'],
        questions: this.props['questions'],
        // questions: this.props['inspectedSurvey'].category.questions,
        gpsCoordinate: '',
        openModal: false,
        routeProps: {}
    };

    componentDidMount() {
        Geolocation.getCurrentPosition(info => {
            var lat = info.coords.latitude.toString();
            var lng  = info.coords.longitude.toString();
            this.setState({
                gpsCoordinate: lat.split('.')[0]+'.'+lat.split('.')[1].substring(0,6)+','+lng.split('.')[0]+'.'+lng.split('.')[1].substring(0,6)
            });
        }, (err) => {
            this.setState({
                gpsCoordinate: ''
            });

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

    submitSurvey(inspection: any){
        this.saveSurvey();

        var sites = {
            siteId: this.state.inspection['siteID'],
            sTypeId: this.state.inspection['sTypeId']
        };
        (this.props as any).actions.setSiteId(sites);
        if(inspection['assets']){
            if(inspection['assets'].length > 0){
                inspection['assets'].forEach((asset: any) => {
                    asset['assetCount'] = asset['count'] ? parseInt(asset['count']) : 0
                })
            }
        }
        var ins = JSON.parse(JSON.stringify(inspection));
        var files: any = [];
        var transactionNo = this.props['route'].params.trans_no;
        this.state.questions.forEach((q: object) => {
            q['audio'].forEach((a: object) => {
                files.push({
                    file_path: a['path'],
                    media_type: 'audio',
                    file_name: a['path'].substr(a['path'].lastIndexOf('/') + 1),
                    trans_no: transactionNo
                })
            })
            q['photo'].forEach((a: object) => {
                files.push({
                    file_path: a['uri'],
                    media_type: 'photo',
                    file_name: a['uri'].substr(a['uri'].lastIndexOf('/') + 1),
                    trans_no: transactionNo
                })
            })
            q['video'].forEach((a: object) => {
                files.push({
                    file_path: a['uri'],
                    media_type: 'video',
                    file_name: a['uri'].substr(a['uri'].lastIndexOf('/') + 1),
                    trans_no: transactionNo
                })
            })
            this.props['userCategoryQuestions'].forEach((category: any) => {
                if(category.qCategoryID == q['qcategoryid']){
                    category.questions.push(q);
                }
            })
        });
        
        var inspectionCategory: Array<any> = this.props['userCategoryQuestions'].filter((category: any) => category.questions.length > 0);
        
        storage.insertFileData_TBL(files);
        inspectionCategory.forEach((item: any) => {
            storage.runQuery(`UPDATE ${storage.question_category_tbl} SET isSurveyCompleted = ${true} where qCategoryID = ${item.qCategoryID}`);
        });
        // storage.runQuery(`UPDATE ${storage.question_category_tbl} SET isSurveyCompleted = ${true} where qCategoryID = ${ins.category.qCategoryID}`);

        storage.runQuery(`select * from ${storage.mobile_data_tbl} where inspectionId = ${ins.data.inspectionId}`).then((res: any) => {
            delete ins.category;
            delete ins.data;
            res[0]['question'] = JSON.parse(res[0]['question']);
            ins.data = res[0];
            if(this.props['userData']['isCategoryScreenEnable'] == true){
                this.getAllCategory(ins);
            }else{
                // this.props['navigation'].navigate('InspectionCategory');
                
                this.props['navigation'].navigate('InspectionsList', {
                    props: this.props['inspection']['inspection']
                });
            }
        });
    }

    async saveSurvey(){
        var dt = new Date();
        var date = dt.getUTCDate() > 9 ? dt.getUTCDate() : '0'+dt.getUTCDate();
        date += '-'+MONTH_NAME[dt.getUTCMonth()];
        date += '-'+dt.getUTCFullYear();

        var txn_date = dt.getUTCDate() > 9 ? dt.getUTCDate() : '0'+dt.getUTCDate();
        txn_date += '-'+(dt.getUTCMonth() > 8 ? (dt.getUTCMonth() + 1) : '0'+(dt.getUTCMonth() + 1));
        txn_date += '-'+dt.getUTCFullYear();
        
        var time = (dt.getUTCHours() > 9 ? dt.getUTCHours() : '0'+dt.getUTCHours())+':'+(dt.getUTCMinutes() > 9 ? dt.getUTCMinutes() : '0'+dt.getUTCMinutes())+':'+(dt.getUTCSeconds() > 9 ? dt.getUTCSeconds() : '0'+dt.getUTCSeconds());

        var rawData: any = [];
        this.state.questions.forEach((q: any) => {
            var hasEvidence = false;
            if(q.video.length > 0 || q.audio.length > 0 || q.photo.length > 0){
                hasEvidence = true;
            }
            var raw: any = {
                questionId: q.questionID,
                qText: q.qtext,
                qCategoryID: q.qcategoryid,
                comment: q.comment,
                choice: (q.choice && q.qtype !== 'MO') ? q.choice.filter((f: any) => f.selected).map((m: any) => m.ctext).join(',') : '',
                hasEvidence: hasEvidence,
                reasonData: q.reason ? q.reason.map((r: any) => r.reasonText) : [],
                qStartDate: q.qStartDate,
                qEndDate: q.qEndDate,
                evidences: []
            };
            if(q.qtype == 'MO'){
                raw['reasonData'] = q.reason.filter(r => r.selected).map((r: any) => r.reasonText);
            }

            q['audio'].forEach((a: object) => {
                raw['evidences'].push({
                    comment: '',
                    fileType: 'Audio',
                    fileName: a['path'].substr(a['path'].lastIndexOf('/') + 1)
                })
            })
            q['photo'].forEach((a: object) => {
                raw['evidences'].push({
                    comment: a['comment'] ? a['comment'] : '',
                    fileType: 'Image',
                    fileName: a['uri'].substr(a['uri'].lastIndexOf('/') + 1)
                })
            })
            q['video'].forEach((a: object) => {
                raw['evidences'].push({
                    comment: a['comment'] ? a['comment'] : '',
                    fileType: 'Video',
                    fileName: a['uri'].substr(a['uri'].lastIndexOf('/') + 1)
                })
            })
            raw['assetValue'] = JSON.stringify(q.qtype == 'AQ' ? this.props['inspectedSurvey']['assets'] : []);

            rawData.push(raw);
        });

        // var transactionNo = (txn_date as string).split('-').join('')+''+(time as string).split(':').join('');
        var transactionNo = this.props['route'].params.trans_no;
        var survey = await storage.runQuery(`select * from ${storage.survey_tbl} where transactionNo = '${transactionNo}'`) as Array<any>;
        
        if(survey.length > 0){
            var inspected_raw = JSON.parse(survey[0]['rawData']);
            rawData.forEach((inspection_ques) => {
                inspected_raw.push(inspection_ques);
            });
            survey[0]['rawData'] = JSON.stringify(inspected_raw);
            storage.updateSurveyData_TBL(survey[0]['rawData'], date+' '+time, transactionNo);
        }else{
            var obj: any = [{
                transactionNo: transactionNo,
                siteId: this.state.inspection.siteID,
                siteCode: this.state.inspection.siteCode,
                siteName: this.state.inspection.siteName,
                inspectionId: this.state.inspection.data.inspectionId,
                inspectionCode: this.state.inspection.data.scode,
                rawData: JSON.stringify(rawData),
                responseStartDate: date+' '+time,
                responseEndDate: date+' '+time,
                gpsCoordinate: this.state.gpsCoordinate,
                is_synced: false
            }];
            
            storage.saveSurveyData_TBL(obj);
        }
        storage.runQuery(`select * from ${storage.survey_tbl}`).then((survey_list: any) => {
            this.props['actions'].updateOfflineSurveyCount(survey_list.length);
        }).catch((err) => {

        })
    }

    getAllCategory(data: any){
        // storage.runQuery(`select * from ${storage.question_category_tbl}`).then((category: any) => {
        //     storage.runQuery(`select * from ${storage.user_category_tbl}`).then((user_category: any) => {
        //         var cat: number[] = JSON.parse(user_category[0]['user_category']);
        //         var res = category.filter((c: any) => cat.includes(c['qCategoryID']));
            var res = this.props['userCategoryQuestions'];
            res.forEach((r: any) => {
                data.data.question.forEach((q: any) => {
                    if(r['qCategoryID'] == q['qcategoryid']){
                        r['questions'].push(q);
                    }
                })
            });

            var all_categories = res.filter((r: any) => r.questions.length > 0);
            this.props['navigation'].navigate('InspectionType', {
                props: data,
                total_category: all_categories.length,
                trans_no: this.props['route'].params.trans_no
            })
        //     })
        // })
    }

    goToEdit(ind: any){

        this.setState({
            openModal: true,
            routeProps: {
                // props: this.props['route'].params.props,
                // complated_trops: JSON.parse(JSON.stringify(this.props['route'].params.trops)),
                present_index: ind,
                // questions: this.props['route'].params.questions,
                title: this.props['route'].params.title,
                total_categories: this.props['route'].params.total_categories,
                has_edit: true,
                trans_no: this.props['route'].params.trans_no
            }
        })
    }

    arrayUnique(arr:Array<object>, key:string){
        var unique = arr.filter((item) => {
            if(item[key]){
                return item;
            }
        })
        .map(item => item[key])
        .filter((value, index, self) =>{
            return  self.indexOf(value) == index;
        });
        return unique;
    }

    render() {
        // this.resetStoreValues(this.props.actions);
        const { inspection, questions } = this.state;
        const { colorLayout } = this.props as any;

        return (
            <Wrapper
                containerStyle={{
                    padding: 0
                }} 
                colorLayout={colorLayout}
                hasHeader={true}
                disableKeyboardBottom={false}
            >
                <View 
                    style={{
                        backgroundColor: colorLayout['subHeaderBgColor'],
                        padding: PADDING_10
                    }}
                >
                    <Text
                        style={{
                            color: colorLayout.headerTextColor,
                            fontSize: TEXT_SIZE_14,
                            fontWeight: '600',
                            textAlignVertical: 'center'
                        }}
                    >
                        {this.state.inspection.data.sname}
                    </Text>
                </View>

                <View
                    style={{
                        backgroundColor: colorLayout.cardBgColor,
                        padding: PADDING_10,
                    }}
                >

                    <Text
                        style={{
                            fontSize: TEXT_SIZE_12,
                            fontWeight: '500',
                            color: colorLayout.appTextColor,
                        }}
                    >
                        ({this.state.inspection.siteCode})
                    </Text>

                    <Text
                        style={{
                            fontSize: TEXT_SIZE_16,
                            fontWeight: '600',
                            color: colorLayout.appTextColor,
                        }}
                    >
                        {this.state.inspection.siteName}
                    </Text>

                    <Text
                        style={{
                            fontSize: TEXT_SIZE_12,
                            color: colorLayout.subTextColor,
                            paddingVertical: PADDING_6,
                            fontWeight: '400'
                        }}
                    >
                        {this.state.inspection.siteAddress}
                    </Text>

                </View>

                <Text
                    style={{
                        fontSize: 16,
                        color: colorLayout.headerTextColor,
                        backgroundColor: colorLayout.headerBgColor,
                        padding: APP_PADDING,
                        fontWeight: '900'
                    }}
                >
                    {this.props['userData']['isCategoryScreenEnable'] == true ? this.state.inspection.category.qCategoryName : this.state.inspection.data.sname}
                </Text>

                <ScrollView
                    style={{...styles.container, backgroundColor: colorLayout.appBgColor}}
                >

                    <View
                        style={{
                            
                        }}
                    >

                        {
                            questions.map((q: any, ind: number) => {
                                return (
                                    <View
                                        style={{
                                            ...styles.historyView, 
                                            marginBottom: questions.length - 1 == ind ? 20 : 5,
                                            backgroundColor: colorLayout.cardBgColor
                                        }}
                                        key={ind}
                                    >
                                        <TouchableOpacity
                                            onPress={() => {
                                                this.goToEdit(ind);
                                            }}
                                            activeOpacity={1}
                                        >

                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                }}
                                            >

                                                <Text
                                                    style={{
                                                        fontSize: 16,
                                                        fontWeight: '400',
                                                        color: colorLayout.appTextColor
                                                    }}
                                                >
                                                    Q.{ind + 1}
                                                </Text>
                                                
                                                <Text
                                                    style={{
                                                        fontSize: 16,
                                                        fontWeight: '400',
                                                        flexWrap: 'wrap',
                                                        paddingHorizontal: 10,
                                                        width: screenWidth * 0.8,
                                                        color: colorLayout.appTextColor
                                                    }}
                                                >
                                                    {q.qtext}
                                                </Text>

                                            </View>

                                        </TouchableOpacity>
                                    
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
                        padding: APP_PADDING
                    }}
                >
                    <TouchableOpacity
                        style={{
                            backgroundColor: colorLayout.headerBgColor,
                            paddingVertical: PADDING_14,
                            borderRadius: BTN_BORDER_RADIUS,
                        }}
                        onPress={async() => {
                            var inspected_survey_data: any = [];
                            this.arrayUnique(this.state.questions, 'qcategoryid').forEach((id: number) => {
                                inspected_survey_data.push({
                                    siteID: inspection['siteID'],
                                    sTypeId: inspection['sTypeId'],
                                    qCategoryID: id,
                                    inspectionId: this.props['inspectedSurvey']['data']['inspectionId'],
                                    isSurveySavedToUpload: false
                                });
                            })
                            // var inspected_survey_data = [{
                            //     siteID: inspection['siteID'],
                            //     sTypeId: inspection['sTypeId'],
                            //     qCategoryID: inspection['category']['qCategoryID'],
                            //     inspectionId: this.props['inspectedSurvey']['data']['inspectionId'],
                            //     isSurveySavedToUpload: false
                            // }];
                            var sql = `delete from ${storage.draft_tbl} where draftId='${this.props?.['inspection']['draftId']}'`;
                            storage.runQuery(sql)
                            .then((res) => {
                                storage.inspectedSurveyCategory_TBL(inspected_survey_data);
                                this.submitSurvey(inspection);
                            }).catch(() => {
                                storage.inspectedSurveyCategory_TBL(inspected_survey_data);
                                this.submitSurvey(inspection);
                            })
                        }}
                    >
                        <Text
                            style={{
                                textAlign: 'center',
                                fontSize: 18,
                                color: colorLayout.headerTextColor,
                                fontWeight: '600',
                                textAlignVertical: 'center'
                            }}
                        >
                            Submit
                        </Text>
                    </TouchableOpacity>
                </View>

                <AlertComponent 
                    message={'Modify your inspection data ?'} 
                    visible={this.state.openModal}
                    onCancel={() => {
                        this.setState({
                            openModal: false
                        })
                    }}
                    onOk={() => {
                        this.setState({
                            openModal: false
                        }, () => {
                            this.props['navigation'].navigate('Question', this.state.routeProps);
                        })
                    }}
                    headerTitle="Confirmation"
                    okText={'Yes'}
                    cancelText={'No'}
                ></AlertComponent>

            </Wrapper>

        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    historyView: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 4,
        // alignSelf: 'center',
        marginTop: 10,
        borderRadius: CARD_BORDER_RADIUS,
        marginHorizontal: PADDING_10,
        paddingVertical: PADDING_10,
        paddingHorizontal: PADDING_10,
    }
});

const mapStateToProps = ({auth}) => {
    return ({
        userData: auth.userData,
        inspectedSurvey: auth.inspectedSurvey,
        colorLayout: auth.colorLayout,
        inspection: auth.inspection,
        userCategoryQuestions: auth.userCategoryQuestions,
        questions: auth.questions
    });
};

const ActionCreators = Object.assign(
    { userData },
    { updateOfflineSurveyCount },
    { setSiteId }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Confirmation);
