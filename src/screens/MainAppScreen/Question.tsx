import React, { PureComponent } from 'react';
import { 
    StyleSheet,
    View,
    Text,
    Dimensions,
    ScrollView,
    TouchableOpacity,
    LogBox,
    Alert, 
    StatusBar,
    Platform,
    Keyboard 
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon, Input, CheckBox, Slider } from 'react-native-elements';
import RNFetchBlob from 'rn-fetch-blob';
import Geolocation from 'react-native-geolocation-service';
import crashlytics from '@react-native-firebase/crashlytics';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { checkMultiple, PERMISSIONS, openSettings} from 'react-native-permissions';


import { 
    ImageComponent, VideoComponent, 
    ReasonComponent, Message, AudioRecordComponent,
    AlertComponent, Connectivity
} from '../../components/common';

import { userData, inspectedSurvey, setQuestions, setInspection } from '../../store/actions';
import { urls, MONTH_NAME, NumericPattern } from '../../utilities/constants';

// database
import * as storage from '../../db';
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
    PADDING_16
} from '../../layout/wrapper';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('screen').height - (StatusBar.currentHeight as any);

const color = {
    danger: '#CD3D3E',
    warning: '#EB9D3E',
    success: '#4DAD49',
    info: '#4CB3D5',
    default: '#565656'
}

class Question extends PureComponent {

    constructor(props) {
        super(props);
    }

    _unsubscribe: any;
    _focus_unsubscribe: any;

    state = {
        registration_code: '',
        showMessage: false,
        visible: false,
        message: '',
        inspection: null,
        questions: [],
        current_index: 0,
        previous_index: 0,
        showImageModal: false,
        showVideoModal: false,
        showAudioModal: false,
        current_question: {},
        selected_choice: null,
        showBackModal: false,
        showReasonModal: false,
        all_reasons: [],
        backgroundColor: '',
        comment: '',
        backAlertMessage: '',
        showKeyboard: false,
        height: screenHeight,
        openAlertModal: false,
        placeholder: 'Enter Comment',
        mode: '',
        cancelText: 'Cancel',
        okText: 'Yes',
        alertHerderTitle: 'Confirmation',
        currentOption: 0,
        openReason: false,
        gpsCoordinate: '',
        showAssetCommentBox: false,
        assetCommentValue: '',
        current_asset: null,
        input_evt: null,
        site_detail_box_height: 0,
        videoTime: 30,
        audioTime: 30,
        maxImage: 5,
        assets_list: [],
        is_lower: true
    };


    componentDidMount() {
        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
        this.watchLocation();

        // JSON.parse(JSON.stringify(this.props['route'].params.props))
        this._unsubscribe = this.props['navigation'].addListener('beforeRemove', (e: any) => {
            if(e.data.action.type == 'GO_BACK'){
                var hasSurveyData = false;
                const { current_question, questions } = this.state;

                questions.forEach((c: any) => {
                    if(c.audio.length > 0 || c.video.length > 0 ||
                        c.photo.length > 0 || c.comment.length > 0 || c.reason.length > 0)
                    {
                        hasSurveyData = true;
                    }
                });
                // var msg = `Clear inspection data for '${this.props?.['route'].params.title}' ?`;
                var msg = `Do you want to save inspection data of '${this.props?.['route'].params.title}' in draft ?`;

                this.setState({
                    openAlertModal: true,
                    backgroundColor: color.danger,
                    message: msg,
                    okText: 'Yes',
                    alertHerderTitle: 'Confirmation',
                    mode: "back",
                    
                });
                e.preventDefault();
            }
        });

        this.initializeStates();
        this.props['navigation'].addListener('focus', (e: any) => {
            this.initializeStates();
        });
    }

    async initializeStates(){
        // if(this.state.inspection){
        //     if(this.state.inspection['assets']){
        //         assets_list = JSON.parse(JSON.stringify(this.state.inspection['assets']))
        //     }
        // }
        var questions: Array<any> = this.props?.['questions'];

        var reasons: any = await storage.runQuery(`select * from ${storage.reasons_tbl}`);
        var current_index = 0;
        var assets_list = [];
        reasons.forEach((r: any) => {
            r.checked = false
        });

        var c_q = questions[current_index];
        var selected_choice = null;

        if(this.props?.['inspection']['isDraft'] == true){
            current_index = this.props?.['inspection']['inspection']['activeQuestionIndex'] ? this.props?.['inspection']['inspection']['activeQuestionIndex'] : 0;
            c_q = questions[current_index];
            selected_choice = c_q.choice[c_q['selected_choice']];
        }else{
            var dt = new Date();
            var date = dt.getUTCDate() > 9 ? dt.getUTCDate() : '0'+dt.getUTCDate();
            date += '-'+MONTH_NAME[dt.getUTCMonth()];
            date += '-'+dt.getUTCFullYear();
            var time = (dt.getUTCHours() > 9 ? dt.getUTCHours() : '0'+dt.getUTCHours())+':'+(dt.getUTCMinutes() > 9 ? dt.getUTCMinutes() : '0'+dt.getUTCMinutes())+':'+(dt.getUTCSeconds() > 9 ? dt.getUTCSeconds() : '0'+dt.getUTCSeconds());
    
            c_q.qStartDate = date+' '+time;
            c_q.qEndDate = '';
        }

        this.setState({
            assets_list: assets_list,
            questions: questions,
            current_index: current_index > questions.length - 1 ? (questions.length - 1) : current_index,
            current_question: c_q,
            all_reasons: reasons,
            inspection: this.props?.['inspection']['inspection'],
            previous_index: current_index > questions.length - 1 ? (questions.length - 1) : current_index,
            comment: c_q.comment,
            selected_choice: selected_choice
        }, () => {
            this.configureEvidences();
        });

        this._focus_unsubscribe = this.props['navigation'].addListener('focus', (e: any) => {

            if(this.props['route'].params.has_edit){
                var assets_list = [];
                if(this.props['inspection']['inspection']['assets']){
                    assets_list = JSON.parse(JSON.stringify(this.props['inspection']['inspection']['assets']))
                }

                this.configureEvidences();
                var qt = this.props['questions'];
                var ind = this.props['route'].params.present_index;

                this.setState({
                    questions: qt,
                    current_index: ind > 0 ? (ind - 1) : ind,
                    previous_index: ind > 2 ? (ind - 2) : ind > 0 ? (ind - 1) : ind,
                    current_question: qt[ind],
                    selected_choice: qt[ind].choice ? qt[ind].choice[qt[ind].selected_choice] : null,
                    assets_list: assets_list

                    // questions: qt,
                    // current_index: ind,
                    // previous_index: ind,
                    // current_question: qt[ind],
                    // selected_choice: qt[ind].choice ? qt[ind].choice[qt[ind].selected_choice] : null,
                    // assets_list: assets_list

                }, () => {
                    if(ind > 0){
                        this.changeQuestionIndex(1, false);
                    }
                })
            }
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

    configureEvidences(){
        getLocalUserData().then((user: any) => {
            if(user['configParam']){
                this.setState({
                    videoTime: user['configParam']['videoTime'] ? user['configParam']['videoTime'] : 30,
                    audioTime: user['configParam']['audioTime'] ? user['configParam']['audioTime'] : 30,
                    maxImage: user['configParam']['maxImage'] ? user['configParam']['maxImage'] : 5
                })
            }
        })
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

    componentWillUnmount(){
        // if(this._unsubscribe){
        //     this._unsubscribe();
        // }
        // if(this._focus_unsubscribe){
        //     this._focus_unsubscribe();
        // }
        // this.setState({
        //     registration_code: '',
        //     showMessage: false,
        //     visible: false,
        //     message: '',
        //     inspection: JSON.parse(JSON.stringify(this.props['route'].params.props)),
        //     questions: [],
        //     current_index: 0,
        //     previous_index: 0,
        //     showImageModal: false,
        //     showVideoModal: false,
        //     showAudioModal: false,
        //     current_question: null,
        //     selected_choice: null,
        //     showBackModal: false,
        //     showReasonModal: false,
        //     all_reasons: [],
        //     backgroundColor: '',
        //     comment: '',
        //     showKeyboard: false,
        //     currentOption: 0,
        //     site_detail_box_height: 0
        // })
    }

    async watchLocation(){
        if(Platform.OS == 'ios'){
            Geolocation.requestAuthorization('whenInUse');
            // Geolocation.setRNConfiguration({
            //     skipPermissionRequests: false,
            //     authorizationLevel: 'whenInUse'
            // });
            this.accessLocation();
        }else{
            this.accessLocation();
        }
    }

    accessLocation(): void{
        Geolocation.getCurrentPosition(info => {
            var lat = info.coords.latitude.toString();
            var lng  = info.coords.longitude.toString();
            this.setState({
                gpsCoordinate: lat.split('.')[0]+'.'+lat.split('.')[1].substring(0,6)+','+lng.split('.')[0]+'.'+lng.split('.')[1].substring(0,6)
            });
        }, (err) => {
            this.setState({
                gpsCoordinate: '0,0'
            });
        },{enableHighAccuracy: false, timeout: 2000000, maximumAge: 100000});
    }

    changeQuestionIndex(n: number, add_time: boolean = true){
        const { questions, current_index, previous_index, selected_choice, current_question }: any = this.state;

        var dt = new Date();
        
        var date = dt.getUTCDate() > 9 ? dt.getUTCDate() : '0'+dt.getUTCDate();
        date += '-'+MONTH_NAME[dt.getUTCMonth()];
        date += '-'+dt.getUTCFullYear();
        // var time = dt.toLocaleTimeString().split(' ')[0];
        var time = (dt.getUTCHours() > 9 ? dt.getUTCHours() : '0'+dt.getUTCHours())+':'+(dt.getUTCMinutes() > 9 ? dt.getUTCMinutes() : '0'+dt.getUTCMinutes())+':'+(dt.getUTCSeconds() > 9 ? dt.getUTCSeconds() : '0'+dt.getUTCSeconds());

        if(n > 0){
            if(!this.validate()){
                return;
            }
            if(!this.validateComment()){
                return;
            }
            if(!this.validateReason()){
                return;
            }
        }
        var c_q = questions[current_index + n];
        var p_q = questions[previous_index + n];

        if(current_question.qtype == 'AQ'){
            var asset_count = this.state.assets_list.filter((a: any) => (a.count ? parseInt(a.count) : 0) !== parseInt(a.assetCount) &&  !a.comment);
            if(asset_count.length > 0){
                this.setState({
                    showMessage: true,
                    backgroundColor: color.danger,
                    message: asset_count[0]['assetName']+' count mismatched',
                });
                return;
            }
        }

        this.setState({
            current_index: current_index + n,
            previous_index: previous_index + n
        }, () => {
            this.setState({
                current_question: c_q,
                comment: c_q.comment
            }, () => {
                if(add_time){
                    if(current_index > current_index + n){
                        // questions[current_index].qStartDate = date+' '+time;
                    }else{
                        var current_ques = questions[current_index + n];
                        var prev_ques = questions[current_index];

                        current_ques.qStartDate = date+' '+time;
                        prev_ques.qEndDate = date+' '+time;

                        var updates_ques = JSON.parse(JSON.stringify(questions));

                        updates_ques[current_index + n].qStartDate = current_ques.qStartDate;
                        updates_ques[current_index + n].qEndDate = current_ques.qEndDate;


                        updates_ques[current_index].qStartDate = prev_ques.qStartDate;
                        updates_ques[current_index].qEndDate = prev_ques.qEndDate;

                        this.setState({
                            questions: updates_ques
                        })

                    }
                    if(n > 0){
                        
                    }else{

                    }
                }
            });
            if(questions[current_index + n].selected_choice !== null && questions[current_index + n].choice !== null){
                this.setState({
                    selected_choice: questions[current_index + n].choice[questions[current_index + n].selected_choice]
                })
            }else{
                if(questions[current_index + n].choice){
                    this.setState({
                        selected_choice: null
                    })
                }else{
                    this.setState({
                        selected_choice: questions[current_index + n].selected_choice
                    })
                }
            }
        });
    }

    validate(){
        const { questions, current_index, previous_index, selected_choice, current_question }: any = this.state;
        var error_message = '';
        if(!selected_choice){
            return true;
        }
        if(selected_choice.video){
            if(!current_question.video){
                if(error_message){
                    error_message += ', video';
                }else{

                    error_message += 'video';
                }
            }
            
            if(current_question.video){
                if(current_question.video.length == 0){
                    if(error_message){
                        error_message += ', video';
                    }else{
    
                        error_message += 'video';
                    }
                }
            }
             
        }
        if(selected_choice.audio){
            
            if(current_question.audio.length == 0){
                if(error_message){
                    error_message += ', audio';
                }else{

                    error_message += 'audio';
                }
            }
        }
        if(selected_choice.photo){
            if(current_question.photo.length == 0){
                if(error_message){
                    error_message += ', image';
                }else{

                    error_message += 'image';
                }
            } 
        }
        
        if(selected_choice.reason){
            if(!current_question.reason){
                this.setState({
                    mode: 'reason'
                }, () => {
                    
                });
                if(error_message){
                    error_message += ', reason';
                }else{

                    error_message += 'reason';
                }
                
            }else{
                this.setState({
                    mode: 'reason'
                })
                if(current_question.reason){
                    if(current_question.reason.length == 0){
                        this.setState({
                            mode: 'reason'
                        }, () => {
                            
                        });
                        if(error_message){
                            error_message += ', reason';
                        }else{
        
                            error_message += 'reason';
                        }
                    }
                }
                
            }
             
        }

        if(error_message){
            this.setState({
                showMessage: true,
                backgroundColor: color.danger,
                message: error_message+' is required',
            });
            setTimeout(function () {
                this.setState({showMessage: false}, () => {
                    if(error_message.includes('reason')){
                        // open reason select modal
                        this.setState({
                            showReasonModal: true
                        })
                    }
                });
                
            }.bind(this), 5000);

            return false;
        }
        return true;
    }

    validateComment(){
        const { questions, current_index, previous_index, selected_choice, current_question }: any = this.state;
        var error_message = '';
        // if(!selected_choice){
        //     return true;
        // }
        if(current_question.willShowComment && current_question.commentmandatory){
            if(!current_question.comment){
                error_message += 'comment';
            } 
        }
        if(error_message){
            this.setState({
                showMessage: true,
                backgroundColor: color.danger,
                message: error_message+' required',
            });
            setTimeout(function () {
                this.setState({showMessage: false});
            }.bind(this), 5000);

            return false;
        }
        return true;
    }

    validateReason(){
        const { questions, current_index, previous_index, selected_choice, current_question }: any = this.state;
        var error_message = '';
        if(!selected_choice){
            return true;
        }
        if(selected_choice.reason){
            if(!current_question.reason){
                error_message += 'reason';
            } 
        }
        if(error_message){
            this.setState({
                showMessage: true,
                backgroundColor: color.danger,
                message: error_message+' required',
            });
            setTimeout(function () {
                this.setState({showMessage: false});
            }.bind(this), 5000);

            return false;
        }
        return true;
    }

    changeChoice(n: number, qtype: string, reason: boolean){
        // this.state.current_question.selected_choice = n;
        var is_selected = false;
        var current_question = JSON.parse(JSON.stringify(this.state.current_question));
        var all_questions = JSON.parse(JSON.stringify(this.state.questions));
        // current_question.reason = [];
        
        if(qtype !== 'MO' && n !== current_question.selected_choice){
            current_question.reason = [];
        }
        current_question.selected_choice = n;

        if(qtype !== 'MO'){
            current_question.choice.forEach((c: any) => {
                c.selected = false;
            })
        }

        if(qtype == 'MO'){
            current_question.reason[n].selected = !current_question.reason[n].selected;
        }else{
            current_question.choice[n].selected = !current_question.choice[n].selected;
        }

        all_questions[this.state.current_index] = current_question;


        if(qtype == 'MO'){
            current_question.reason.forEach((c: any) => {
                if(c.selected){
                    is_selected = true;
                }
            })
        }else{
            is_selected = true;
        }

        if(current_question.selected_choice.toString() && (
            current_question.audio.length > 0 || 
            current_question.video.length > 0 ||
            current_question.photo.length > 0 || current_question.comment.length > 0) && qtype !== 'MO')
        {
            this.setState({
                openAlertModal: true,
                backgroundColor: color.danger,
                message: "Are you sure want to change option and remove current data ?",
                okText: 'Yes',
                alertHerderTitle: 'Confirmation',
                mode: "option",
                currentOption: n,
                openReason: reason
            });
        }else{
            this.setState({
                selected_choice: is_selected ? (current_question.choice ? current_question.choice[n] : current_question.reason[n]) : null,
                current_question: current_question,
                comment: current_question.comment,
                questions: all_questions,
                showReasonModal: reason
            }, () => {
                const { selected_choice }: any = this.state;
                if(selected_choice !== null && selected_choice !== undefined){
                    if(selected_choice.video == true){
                        this.openVideoCameraModal();
                    }
                    else if(selected_choice.audio == true){
                        this.openAudioModal();
                    }
                    else if(selected_choice.photo == true){
                        this.openImageCameraModal();
                    }
                }
            })
        }
    }

    removeSelectedChoice(){
        var current_question = JSON.parse(JSON.stringify(this.state.current_question));
        current_question.selected_choice = this.state.currentOption;
        
        if(current_question.audio.length > 0){
            RNFetchBlob.fs.unlink(current_question.audio[0].path).then(res => {

            });
        }
        if(current_question.video.length > 0){
            RNFetchBlob.fs.unlink(current_question.video[0].uri).then(res => {
                
            });
        }
        if(current_question.photo.length > 0){
            current_question.photo.forEach((p: any, lenn: number) => {
                RNFetchBlob.fs.unlink(p.uri).then(res => {
                    
                });
            })
        }
        current_question.audio = [];
        current_question.audioLength = 0;
        current_question.recordingSaved = false;
        current_question.video = [];
        current_question.videoLength = 0;
        current_question.photo = [];
        current_question.reason = [];
        current_question.comment = '';

        current_question.recordingSaved = false;
        current_question.videoSaved = false;
        current_question.imagesSaved = false;

        current_question.choice.forEach((c: any) => {
            c.selected = false;
        });

        this.setState({
            openAlertModal: false,
            selected_choice: current_question.choice[this.state.currentOption],
            current_question: current_question,
            comment: current_question.comment,
            showReasonModal: this.state.openReason
        }, () => {
            
        })
    }

    openVideoCameraModal(){
        checkMultiple([PERMISSIONS.IOS.CAMERA, PERMISSIONS.ANDROID.CAMERA]).then((statuses) => {
            if(statuses[PERMISSIONS.IOS.CAMERA] == 'granted' || statuses[PERMISSIONS.ANDROID.CAMERA] == 'granted'){
                this.setState({showVideoModal: true});
            }else{
                this.setState({
                    openAlertModal: true,
                    backgroundColor: color.danger,
                    placeholder: 'Enter Comment',
                    message: 'FACTT cann\'t access camera',
                    okText: 'Open Setting',
                    alertHerderTitle: 'Confirmation',
                    mode: 'media'
                });
            }
        });
    }

    openAudioModal(){
        checkMultiple([PERMISSIONS.IOS.MICROPHONE, PERMISSIONS.ANDROID.RECORD_AUDIO]).then((statuses) => {
            if(statuses[PERMISSIONS.IOS.MICROPHONE] == 'granted' || statuses[PERMISSIONS.ANDROID.RECORD_AUDIO] == 'granted'){
                this.setState({showAudioModal: true});
            }else{
                this.setState({
                    openAlertModal: true,
                    backgroundColor: color.danger,
                    placeholder: 'Enter Comment',
                    message: 'FACTT cann\'t access microphone',
                    okText: 'Open Setting',
                    alertHerderTitle: 'Confirmation',
                    mode: 'media'
                });
            }
        });
    }

    openImageCameraModal(){
        checkMultiple([PERMISSIONS.IOS.CAMERA, PERMISSIONS.ANDROID.CAMERA]).then((statuses) => {
            if(statuses[PERMISSIONS.IOS.CAMERA] == 'granted' || statuses[PERMISSIONS.ANDROID.CAMERA] == 'granted'){
                this.setState({showImageModal: true});
            }else{
                this.setState({
                    openAlertModal: true,
                    backgroundColor: color.danger,
                    placeholder: 'Enter Comment',
                    message: 'FACTT cann\'t access camera',
                    okText: 'Open Setting',
                    alertHerderTitle: 'Confirmation',
                    mode: 'media'
                });
            }
        });
    }


    finishSurvey(){
        if(!this.validate()){
            return;
        }
        var dt = new Date();
        var current_question: any = this.state.current_question;
        
        if(current_question.qtype == 'AQ'){
            var asset_count = this.state.assets_list.filter((a: any) => (a.count ? parseInt(a.count) : 0) !== parseInt(a.assetCount) &&  !a.comment);
            if(asset_count.length > 0){
                this.setState({
                    showMessage: true,
                    backgroundColor: color.danger,
                    message: asset_count[0]['assetName']+' count mismatched',
                });
                return;
            }
        }

        var date = dt.getUTCDate() > 9 ? dt.getUTCDate() : '0'+dt.getUTCDate();
        date += '-'+MONTH_NAME[dt.getUTCMonth()];
        date += '-'+dt.getUTCFullYear();
        // var time = dt.toLocaleTimeString().split(' ')[0];
        var time = (dt.getUTCHours() > 9 ? dt.getUTCHours() : '0'+dt.getUTCHours())+':'+(dt.getUTCMinutes() > 9 ? dt.getUTCMinutes() : '0'+dt.getUTCMinutes())+':'+(dt.getUTCSeconds() > 9 ? dt.getUTCSeconds() : '0'+dt.getUTCSeconds());

        var questions = JSON.parse(JSON.stringify(this.state.questions));
        questions[questions.length - 1].qEndDate = date+' '+time;

        var inspection = JSON.parse(JSON.stringify(this.state.inspection));

        // inspection.category.questions = questions;
        inspection.assets = this.state.assets_list;

        this.props['actions'].inspectedSurvey({data: inspection});
        this.props['actions'].setQuestions({data: questions});
        
        this.props['navigation'].navigate('Confirmation',{
            // props: inspection,
            // trops: inspection,
            title: this.props['route'].params.title,
            total_category: this.props['route'].params.total_categories,
            // questions: questions,
            trans_no: this.props['inspection'].trans_no
        });

    }

    getReasons(selected_reasons: any, reasons_list: any, q_cat_id){
        var list = reasons_list.filter((re: any) => re.qCategoryId == q_cat_id)
        list.forEach((r: any) => {
            r.checked = selected_reasons.filter((f => f.checked)).map(m => m.reasonID).includes(r.reasonID);
        });
        return list;
    }

    async createDraft(){
        var category = this.props?.['inspection']['inspection']['category'];
        var question: Array<any> = JSON.parse(JSON.stringify(this.state.questions));

        var draftList: Array<any> = [];
        var inspected_questions = question.splice(0, this.state.current_index+1);
        var userCategoryQuestions = JSON.parse(JSON.stringify(this.props['userCategoryQuestions']));


        if(this.props?.['inspection']['isDraft'] == true){
            var draftId = this.props?.['inspection']['draftId']
            // var sql = `update ${storage.draft_tbl} set questions='${JSON.stringify(question.splice(0, this.state.current_index+1))}', activeQuestionIndex=${this.state.current_index} where draftId='${draftId}'`;
            var sql = `delete from ${storage.draft_tbl} where draftId='${draftId}'`;
            await storage.runQuery(sql);
        }
        
        var draftList: Array<any> = [];
        // var draft = {
        //     draftId: this.props?.['inspection']['draftId'],
        //     sTypeId: this.props?.['inspection']['inspection']['sTypeId'],
        //     siteId: this.props?.['inspection']['inspection']['siteID'],
        //     qCategoryID: category['qCategoryID'],
        //     transactionNo: this.props?.['inspection']['trans_no'],
        //     activeQuestionIndex: this.state.current_index,
        //     questions: JSON.stringify(),
        //     inspectionId: this.props?.['inspection']['inspection']['data']['inspectionId']
        // };
        userCategoryQuestions.forEach((r: any) => {
            r['questions'] = [];
            inspected_questions.forEach((q: any) => {
                if(r['qCategoryID'] == q['qcategoryid']){
                    r['questions'].push(q);
                }
            });
        });
        var all_categories = userCategoryQuestions.filter((r: any) => r.questions.length > 0);
        
        all_categories.forEach((c: any) => {
            draftList.push({
                draftId: this.props?.['inspection']['draftId'],
                sTypeId: c['sTypeId'],
                siteId: this.props?.['inspection']['inspection']['siteID'],
                qCategoryID: c['qCategoryID'],
                transactionNo: this.props?.['inspection']['trans_no'],
                activeQuestionIndex: this.state.current_index,
                questions: JSON.stringify(c.questions),
                inspectionId: this.props?.['inspection']['inspection']['data']['inspectionId']
            })
        });
        storage.insertDraftData_TBL(draftList);
        
        if(this.props['userData']['isCategoryScreenEnable'] == true){
            this.props['navigation'].navigate('InspectionType', {
                props: this.props?.['inspection']['inspection'],
                total_category: this.props?.['inspection']['total_categories'],
                trans_no: this.props?.['inspection']['trans_no']
            });
        }else{
            this.props['navigation'].navigate('InspectionsList', {
                props: this.props['inspection']['inspection']
            });
        }
    }

    render() {
        // this.resetStoreValues(this.props.actions);
        const { colorLayout } = this.props as any;
        const { selected_choice, questions, current_index, current_question }: any = this.state;
        // const current_question = questions[current_index];

        return (
            <Wrapper
                containerStyle={{
                    padding: 0,
                    backgroundColor: colorLayout.appBgColor
                }}
                colorLayout={colorLayout}
                hasHeader={true}
                scrollEnabled={false}
                disableKeyboardBottom={false}
            >

                <ScrollView
                    style={{
                        // height: BODY_BOX_HEIGHT - 55,
                        backgroundColor: colorLayout.appBgColor,
                    }}
                    keyboardShouldPersistTaps={'always'}
                    scrollEventThrottle={10000}
                    scrollEnabled={true}
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
                        ({this.state.inspection ? this.state.inspection['data']['scode'] : ''})
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
                        {this.state.inspection ? this.state.inspection['data']['sname'] : ''}
                    </Text>
                </View>

                


                <View
                    style={{
                        backgroundColor: colorLayout.cardBgColor,
                        padding: APP_PADDING,
                        // height: this.state.site_detail_box_height > 0 ? this.state.site_detail_box_height : 'auto'
                    }}
                    onLayout={(event) => {
                        this.setState({
                            site_detail_box_height: event.nativeEvent.layout.height
                        }, () => {
                            
                        })
                    }}
                >

                    <Text
                        style={{
                            color: colorLayout.appTextColor,
                            fontSize: TEXT_SIZE_10,
                            fontWeight: '600'
                        }}
                    >
                        ({this.state.inspection ? this.state.inspection['siteCode'] : ''})
                    </Text>

                    <Text
                        style={{
                            fontSize: TEXT_SIZE_14,
                            color: colorLayout.appTextColor,
                            fontWeight: '700'
                        }}
                    >
                        {this.state.inspection ? this.state.inspection['siteName'] : ''}
                    </Text>

                    <Text
                        style={{
                            fontSize: TEXT_SIZE_12,
                            color: colorLayout.subTextColor,
                            marginTop: 3,
                            backgroundColor: 'transparent'
                        }}
                    >
                        {this.state.inspection ? this.state.inspection['siteAddress'] : ''}
                    </Text>

                </View>
            
                {/* <View
                    style={{
                        height: this.state.height - this.state.site_detail_box_height - 55,
                        flexDirection: 'column',
                        flex: 1
                    }}
                > */}

                <View
                    style={{
                        flexDirection: 'row',
                        paddingHorizontal: screenWidth * 0.05,
                        paddingTop: 10,
                        alignSelf: 'center'
                    }}
                >
                    <Text
                        style={{
                            marginRight: 5,
                            fontWeight: '500',
                            color: colorLayout.appTextColor
                        }}
                    >
                        1
                    </Text>
                        <View
                            style={{
                                flexDirection: 'row',
                                marginTop: 10
                            }}
                        >
                            {
                                questions.map((q, ind: number) => {
                                    return (
                                        <Text
                                            key={ind}
                                            style={{
                                                width: (screenWidth * 0.8)/questions.length,
                                                height: 3,
                                                backgroundColor: ind == current_index ? colorLayout.subHeaderBgColor : ind < current_index ? 'green' : '#d3d3d3',
                                                marginLeft: -1,
                                                overflow: 'visible',
                                                color: 'red'
                                            }}
                                        >
                                        </Text>
                                    );
                                }) 
                            }
                        </View>
                    <Text
                        style={{
                            marginLeft: 5,
                            fontWeight: '500',
                            color: colorLayout.appTextColor
                        }}
                    >
                        {questions.length}
                    </Text>
                </View>

                {
                    current_question &&
                    <View
                        style={{

                        }}
                    >
                            <View
                                style={{
                                    height: current_question.qtype == 'AQ' ? 65 : 90
                                }}
                            >
                                <ScrollView
                                    style={{
                                        maxHeight: 90,
                                        paddingHorizontal: 10
                                    }}
                                    scrollEnabled={true}
                                    persistentScrollbar={true}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            marginTop: 8,
                                            color: colorLayout.appTextColor,
                                            fontSize: 14,
                                            paddingHorizontal: 5,
                                        }}
                                    >
                                        Q.{current_index + 1} {current_question.qtext}
                                    </Text>
                                </ScrollView>
                            </View>

                            {
                                this.state.current_question['choice']
                                &&
                                <View
                                    style={{
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        marginTop: 10,
                                        // paddingVertical: 10,
                                        alignItems: 'center',
                                        paddingBottom: 5,
                                    }}
                                >

                                    {
                                        (current_question.qtype == 'YN' || current_question.qtype == 'YNA') &&
                                        this.state.current_question['choice'].map((c: any, c_index: number) => {
                                            return (
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: this.state.current_question['selected_choice'] == c_index ? colorLayout.subHeaderBgColor : colorLayout.cardBgColor,
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 12,
                                                        borderRadius: 8,
                                                        elevation: 5,
                                                        marginVertical: 5,
                                                        width: screenWidth * 0.7
                                                    }}
                                                    onPress={() => {
                                                        this.changeChoice(c_index, current_question.qtype, c.reason);
                                                    }}
                                                    key={c_index}
                                                    activeOpacity={0.9}
                                                >
                                                    <Text
                                                        style={{
                                                            color: this.state.current_question ? this.state.current_question['selected_choice'] == c_index ? colorLayout.headerTextColor : colorLayout.subTextColor : colorLayout.subTextColor,
                                                            fontWeight: '700',
                                                            fontSize: 14,
                                                            textTransform: 'uppercase',
                                                            textAlignVertical: 'center',
                                                            textAlign: 'center'
                                                        }}
                                                    >
                                                        {c.ctext}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })
                                    } 
                                    
                                    {
                                        current_question.qtype == 'MO' && 
                                        <View>
                                            {
                                                this.state.current_question['reason'].map((c: any, c_index: number) => {
                                                    return (
                                                        <TouchableOpacity
                                                            style={{
                                                                backgroundColor: c.selected ? colorLayout.cardBgColor : '#eee',
                                                                paddingVertical: 10,
                                                                borderRadius: 6,
                                                                width: screenWidth - 20,
                                                                flexDirection: 'row',
                                                                marginVertical: 5,
                                                                justifyContent: 'flex-start',
                                                                paddingHorizontal: 10,
                                                                borderColor: colorLayout.subHeaderBgColor,
                                                                elevation: 5
                                                            }}
                                                            onPress={() => {
                                                                // this.setState({
                                                                //     showReasonModal: c.reason
                                                                // }, () => {
                                                                    this.changeChoice(c_index, current_question.qtype, c.reason);
                                                                // })
                                                            }}
                                                            key={c_index}
                                                            activeOpacity={0.8}
                                                        >

                                                            <CheckBox
                                                                checked={c.selected}
                                                                onPress={() => {
                                                                    this.changeChoice(c_index, current_question.qtype, c.reason);
                                                                }}
                                                                containerStyle={{
                                                                    margin: 0,
                                                                    padding: 0,
                                                                    width: 10,
                                                                    marginLeft: 0,
                                                                    marginVertical: -2
                                                                }}
                                                                checkedColor={colorLayout.subHeaderBgColor}
                                                                uncheckedColor={colorLayout.subTextColor}
                                                            />
                                                            
                                                            <Text
                                                                style={{
                                                                    color: c.selected ? colorLayout.subHeaderBgColor : colorLayout.color_2,
                                                                    fontWeight: '700',
                                                                    fontSize: 14,
                                                                    textTransform: 'uppercase',
                                                                    width: (screenWidth - 20) - 40,
                                                                    marginLeft: 5,
                                                                    textAlignVertical: 'top',
                                                                }}
                                                            >
                                                                {c.ctext}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })
                                            }
                                        </View>
                                    }

                                </View>
                            }

                            {
                                current_question.qtype == 'MO'
                                &&
                                <View
                                    style={{
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        marginTop: 10,
                                        // paddingVertical: 10,
                                        alignItems: 'center',
                                        paddingBottom: 5,
                                    }}
                                >

                                
                                    
                                    <View>
                                            {
                                                this.state.current_question['reason'].map((c: any, c_index: number) => {
                                                    return (
                                                        <TouchableOpacity
                                                            style={{
                                                                backgroundColor: c.selected ? colorLayout.cardBgColor : '#eee',
                                                                paddingVertical: 10,
                                                                borderRadius: 6,
                                                                width: screenWidth - 20,
                                                                flexDirection: 'row',
                                                                marginVertical: 5,
                                                                justifyContent: 'flex-start',
                                                                // alignItems: 'center',
                                                                paddingHorizontal: 10,
                                                                borderColor: colorLayout.subHeaderBgColor,
                                                                elevation: 5
                                                            }}
                                                            onPress={() => {
                                                                // this.setState({
                                                                //     showReasonModal: c.reason
                                                                // }, () => {
                                                                    this.changeChoice(c_index, current_question.qtype, c.reason);
                                                                // })
                                                            }}
                                                            key={c_index}
                                                            activeOpacity={0.8}
                                                        >

                                                            <CheckBox
                                                                checked={c.selected}
                                                                onPress={() => {
                                                                    this.changeChoice(c_index, current_question.qtype, c.reason);
                                                                }}
                                                                containerStyle={{
                                                                    margin: 0,
                                                                    padding: 0,
                                                                    width: 10,
                                                                    marginLeft: 0,
                                                                    marginVertical: -2
                                                                }}
                                                                checkedColor={colorLayout.subHeaderBgColor}
                                                                uncheckedColor={colorLayout.subTextColor}
                                                            />
                                                            
                                                            <Text
                                                                style={{
                                                                    color: c.selected ? colorLayout.subHeaderBgColor : colorLayout.subTextColor,
                                                                    fontWeight: '700',
                                                                    fontSize: 14,
                                                                    textTransform: 'uppercase',
                                                                    width: (screenWidth - 20) - 40,
                                                                    marginLeft: 5,
                                                                    textAlignVertical: 'top',
                                                                }}
                                                            >
                                                                {c.reasonText}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })
                                            }
                                        </View>

                                </View>
                            }

                            {
                                current_question.qtype == 'AQ' && 
                                <View>
                                    {
                                        this.state.assets_list.map((asset: any, asset_index: number) => {
                                            return (
                                                <View
                                                    key={asset_index}
                                                    style={{
                                                        paddingVertical: 16,
                                                        borderBottomColor: colorLayout.cardBgColor,
                                                        borderBottomWidth: 2,
                                                        marginHorizontal: 16,
                                                        flexDirection: 'row',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: colorLayout.subTextColor,
                                                            fontSize: 14,
                                                            fontWeight: '600',
                                                            flex: 1
                                                        }}
                                                        numberOfLines={1}
                                                        ellipsizeMode={'clip'}
                                                    >
                                                        {asset.assetName} 
                                                        {/* {asset.assetCount > 0 ? `[${asset.assetCount}]` : ''} */}
                                                    </Text>

                                                    <View
                                                        style={{
                                                            flexDirection: 'row'
                                                        }}
                                                    >

                                                        {
                                                            <Icon
                                                                name='commenting'
                                                                type='font-awesome'
                                                                color={
                                                                    (asset.assetCount.toString() !== asset.count && !asset.comment) ?
                                                                    '#ff0000' : 'green'
                                                                }
                                                                containerStyle={{
                                                                    alignSelf: 'center',
                                                                    opacity: 1,
                                                                    marginRight: 10,
                                                                    display: asset.count ? asset.assetCount.toString() !== asset.count ? 'flex' : 'none' : 'flex'
                                                                }}
                                                                iconStyle={{
                                                                    fontSize: 26,
                                                                }}
                                                                
                                                                onPress={() => {
                                                                    Keyboard.dismiss();
                                                                    this.setState({
                                                                        message: 'Enter Comment',
                                                                        placeholder: `Your comment here`,
                                                                        openAlertModal: true,
                                                                        mode: 'asset_comment',
                                                                        alertHerderTitle: `Mismatched - '${asset.assetName}'`,
                                                                        okText: 'Continue',
                                                                        showAssetCommentBox: true,
                                                                        assetCommentValue: asset.comment,
                                                                        current_asset: asset
                                                                    });
                                                                }}
                                                            />
                                                        }
                                                        <Input
                                                            placeholder='0'
                                                            value={asset.count}
                                                            style={{
                                                                fontSize: 14,
                                                                textAlign: 'center'
                                                            }}
                                                            containerStyle={{
                                                                backgroundColor: '#fff',
                                                                height: 40,
                                                                borderWidth: 1,
                                                                borderRadius: 8,
                                                                borderColor: '#d3d3d3',
                                                                width: 70,
                                                                
                                                            }}
                                                            inputStyle={{
                                                                
                                                            }}
                                                            inputContainerStyle={{
                                                                borderBottomWidth: 0,
                                                            }}
                                                            multiline={false}
                                                            onChangeText={(text: string) => {
                                                                var assets_list = JSON.parse(JSON.stringify(this.state.assets_list));

                                                                assets_list.forEach((a_l) => {
                                                                    if(a_l['assetId'] == asset.assetId){
                                                                        a_l['count'] = NumericPattern(text);
                                                                        a_l['comment'] = '';
                                                                    }
                                                                })
                                                                
                                                                this.setState({
                                                                    assets_list: assets_list
                                                                })
                                                            }}
                                                            editable={true}
                                                            keyboardType={'numeric'}
                                                            maxLength={3}
                                                        />
                                                        {/* asset.assetCount.toString().length */}
                                                    </View>
                                                </View>
                                            )
                                        })
                                    }
                                </View>
                            }
                    </View>
                }
                   

                </ScrollView>
                    <View
                        style={{
                            padding: APP_PADDING,
                            backgroundColor: colorLayout.cardBgColor,
                            // borderTopLeftRadius: 30,
                            // borderTopRightRadius: 30,
                            // height: current_question ? current_question.qtype == 'AQ' ? 140 : current_question.qtype == 'MO' ? 90 : 120 : 100,
                            // flex: 1
                        }}
                    >

                        <View
                            style={{
                                display: current_question ? (current_question.qtype == 'MO' || current_question.qtype == 'AQ') ? 'none' : 'flex' : 'flex'
                            }}
                        >
                        <Input
                            placeholder='Your comment here'
                            value={this.state.comment}
                            style={{
                                
                            }}
                            containerStyle={{
                                backgroundColor: '#fff',
                                height: 80,
                                borderWidth: 1,
                                borderRadius: 8,
                                borderColor: '#d3d3d3',
                                display: current_question.willShowComment ? 'flex' : 'none'
                            }}
                            inputStyle={{
                                fontSize: 16
                            }}
                            inputContainerStyle={{
                                borderBottomWidth: 0
                            }}
                            multiline={true}
                            onChangeText={(text: string) => {
                                var ques = JSON.parse(JSON.stringify(this.state.questions));
                                ques[this.state.current_index].comment = text;
                                ques[this.state.current_index].selected_choice = this.state.current_question ? this.state.current_question['selected_choice'] : null
                                this.setState({
                                    comment: text,
                                    questions: ques,
                                    current_question: ques[this.state.current_index]
                                });
                            }}
                            editable={current_question ? current_question.commentmandatory : false}
                        />
                        </View>
                        

                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                // flex: 1,
                                display: current_question ? current_question.qtype == 'MO' ? 'none' : 'flex' : 'flex',
                                alignItems: 'center',
                                paddingVertical: PADDING_12
                            }}
                        >
                            <View
                                style={{
                                    opacity: current_question && selected_choice ? 
                                    selected_choice.video ? 
                                    current_question.video.length > 0 ?
                                    1
                                    :
                                    1
                                    : 
                                    0.4
                                    :
                                    0.4
                                }}
                            >
                                
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        // justifyContent: 'center',
                                        // flex: 1,
                                        // paddingLeft: 5
                                    }}
                                    onPress={() => {
                                        this.openVideoCameraModal();
                                    }}
                                    disabled={selected_choice ? !selected_choice.video : true}
                                >
                                    <Icon
                                        name='video-camera'
                                        type='font-awesome'
                                        color={
                                            current_question && selected_choice ? 
                                            selected_choice.video ? 
                                            current_question.video.length > 0 ?
                                            colorLayout.subHeaderBgColor
                                            :
                                            colorLayout.subHeaderBgColor 
                                            : 
                                            '#333'
                                            :
                                            '#333'
                                        }
                                        containerStyle={{
                                            alignSelf: 'center',
                                            opacity: 1,
                                        }}
                                        iconStyle={{
                                            fontSize: 20,
                                        }}
                                        
                                    />
                                    <Text 
                                    style={{
                                        color: current_question && selected_choice ? 
                                        selected_choice.video ? 
                                        current_question.video.length > 0 ?
                                        colorLayout.subHeaderBgColor
                                        :
                                        colorLayout.subHeaderBgColor 
                                        : 
                                        '#333'
                                        :
                                        '#333', 
                                        opacity: 1, 
                                        marginTop: 2, 
                                        fontWeight: '500',
                                        marginHorizontal: 5,
                                        textAlignVertical: 'center'
                                    }}
                                    >Video
                                    </Text>

                                    <Icon
                                        name={'check-circle-o'}
                                        type='font-awesome'
                                        color={'green'}
                                        containerStyle={{
                                            marginTop: 5,
                                            display: current_question && selected_choice ? 
                                            selected_choice.video ? 
                                            current_question.video.length > 0 ?
                                            'flex'
                                            :
                                            'none'
                                            : 
                                            'none'
                                            :
                                            'none'
                                        }}
                                        iconStyle={{
                                            fontSize: 12,
                                        }}
                                        
                                    />
                                </TouchableOpacity>
                            </View>

                            <Text style={{color: '#333', opacity: 0.2, fontWeight: '600'}}>|</Text>

                            <View
                                style={{
                                    opacity: selected_choice 
                                        ? 
                                        selected_choice.audio 
                                            ? 
                                            1 
                                            : 
                                            0.4 
                                        : 
                                        0.4,
                                    // flex: 1
                                }}
                            >
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        // justifyContent: 'center',
                                        // flex: 1,
                                        // paddingLeft: 10
                                    }}
                                    onPress={() => {
                                        this.openAudioModal();
                                    }}
                                    disabled={selected_choice ? !selected_choice.audio : true}
                                >
                                    <Icon
                                        name='microphone'
                                        type='font-awesome'
                                        color={
                                            current_question && selected_choice ? 
                                            selected_choice.audio ? 
                                            current_question.audio.length > 0 ?
                                            colorLayout.subHeaderBgColor
                                            :
                                            colorLayout.subHeaderBgColor 
                                            : 
                                            '#333'
                                            :
                                            '#333'
                                        }
                                        containerStyle={{
                                            alignSelf: 'center',
                                            opacity: 1
                                        }}
                                        iconStyle={{
                                            fontSize: 20,
                                        }}
                                        
                                    />
                                    <Text style={{
                                        color: current_question && selected_choice ? 
                                        selected_choice.audio ? 
                                        current_question.audio.length > 0 ?
                                        colorLayout.subHeaderBgColor
                                        :
                                        colorLayout.subHeaderBgColor 
                                        : 
                                        '#333'
                                        :
                                        '#333', 
                                        opacity: 1, 
                                        fontWeight: '500',
                                        // width: 45,
                                        textAlignVertical: 'center',
                                        marginHorizontal: 5
                                    }}
                                    >Audio</Text>

                                    <Icon
                                        name={'check-circle-o'}
                                        type='font-awesome'
                                        color={'green'}
                                        containerStyle={{
                                            marginTop: 2,
                                            display: current_question && selected_choice ? 
                                            selected_choice.audio ? 
                                            current_question.audio.length > 0 ?
                                            'flex'
                                            :
                                            'none'
                                            : 
                                            'none'
                                            :
                                            'none'
                                        }}
                                        iconStyle={{
                                            fontSize: 12,
                                        }}
                                        
                                    />
                                    
                                </TouchableOpacity>
                            </View>

                            <Text style={{color: '#333', opacity: 0.2, fontWeight: '600'}}>|</Text>

                            <View
                                style={{
                                    opacity: selected_choice 
                                        ? 
                                        selected_choice.photo 
                                            ? 
                                            1 
                                            : 
                                            0.4 
                                        : 
                                        0.4,
                                    // flex: 1,
                                }}
                            >
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        // flex: 1,
                                        // paddingLeft: 10,
                                    }}
                                    onPress={() => {
                                        this.openImageCameraModal();
                                    }}
                                    disabled={selected_choice ? !selected_choice.photo : true}
                                >
                                    <Icon
                                        name='camera'
                                        type='font-awesome'
                                        color={
                                            current_question && selected_choice ? 
                                            selected_choice.photo ? 
                                            current_question.photo.length > 0 ?
                                            colorLayout.subHeaderBgColor
                                            :
                                            colorLayout.subHeaderBgColor 
                                            : 
                                            '#333'
                                            :
                                            '#333'
                                        }
                                        containerStyle={{
                                            alignSelf: 'center',
                                            // marginRight: -5
                                        }}
                                        iconStyle={{
                                            fontSize: 20,
                                        }}
                                        
                                    />
                                    <Text 
                                        style={{
                                            color: current_question && selected_choice ? 
                                            selected_choice.photo ? 
                                            current_question.photo.length > 0 ?
                                            colorLayout.subHeaderBgColor
                                            :
                                            colorLayout.subHeaderBgColor 
                                            : 
                                            '#333'
                                            :
                                            '#333', 
                                            opacity: 1, 
                                            fontWeight: '500',
                                            textAlignVertical: 'center',
                                            marginHorizontal: 5
                                        }}
                                    >Image</Text>

                                    <Icon
                                        name={'check-circle-o'}
                                        type='font-awesome'
                                        color={'green'}
                                        containerStyle={{
                                            marginTop: 5,
                                            display: current_question && selected_choice ? 
                                            selected_choice.photo ? 
                                            current_question.photo.length > 0 ?
                                            'flex'
                                            :
                                            'none'
                                            : 
                                            'none'
                                            :
                                            'none'
                                        }}
                                        iconStyle={{
                                            fontSize: 12,
                                        }}
                                        
                                    />

                                </TouchableOpacity>
                            </View>
                            

                        </View>
                        {
                            !this.props['route'].params.has_edit &&
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-around',
                                    marginHorizontal: -APP_PADDING
                                }}
                            >

                                <View
                                    style={{
                                        display: this.state.previous_index > 0 ? 'flex' : 'none',
                                        flex: 1,
                                        paddingHorizontal: APP_PADDING
                                    }}
                                >
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: colorLayout.headerBgColor,
                                            paddingVertical: PADDING_14,
                                            borderRadius: BTN_BORDER_RADIUS
                                        }}
                                        onPress={() => {
                                            this.changeQuestionIndex(-1);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 15,
                                                color: '#ffffff',
                                                fontWeight: '600',
                                                textAlignVertical: 'center'
                                            }}
                                        >
                                            PREVIOUS
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View
                                    style={{
                                        display : this.state.current_index+1 == questions.length ? 'none' : 'flex',
                                        opacity: selected_choice ? 1 : 0.7,
                                        flex: 1,
                                        paddingHorizontal: APP_PADDING
                                    }}
                                >
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: colorLayout.headerBgColor,
                                            paddingVertical: PADDING_14,
                                            borderRadius: BTN_BORDER_RADIUS,
                                        }}
                                        onPress={() => {
                                            this.changeQuestionIndex(1);
                                        }}
                                        activeOpacity={0.8}
                                        disabled={selected_choice ? false : true}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 15,
                                                color: colorLayout.headerTextColor,
                                                fontWeight: '600',
                                                textAlignVertical: 'center'
                                            }}
                                        >
                                            NEXT
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                
                                <View
                                    style={{
                                        flex: 1,
                                        paddingHorizontal: APP_PADDING,
                                        display : this.state.current_index+1 == questions.length ? 'flex' : 'none',
                                        opacity: selected_choice ? 1 : 0.7
                                    }}
                                >
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: colorLayout.headerBgColor,
                                            paddingVertical: PADDING_14,
                                            borderRadius: BTN_BORDER_RADIUS,
                                        }}
                                        onPress={() => {
                                            this.finishSurvey();
                                        }}
                                        activeOpacity={0.8}
                                        disabled={selected_choice ? false : true}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 15,
                                                color: colorLayout.headerTextColor,
                                                fontWeight: '600',
                                                textAlignVertical: 'center'
                                            }}
                                        >
                                            FINISH
                                        </Text>
                                    </TouchableOpacity>  
                                </View>
                                
                            </View>
                        }

                        {
                            this.props['route'].params.has_edit &&
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-around',
                                    marginBottom: Platform.OS == 'ios' ? -2 : 0
                                }}
                            >
                                <View
                                    style={{
                                        width: screenWidth * 0.9,
                                    }}
                                >
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: colorLayout.headerBgColor,
                                            paddingVertical: 14,
                                            borderRadius: 8,
                                        }}
                                        onPress={() => {
                                            this.finishSurvey();
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 15,
                                                color: colorLayout.headerTextColor,
                                                fontWeight: '600',
                                                textAlignVertical: 'center'
                                            }}
                                        >
                                            DONE
                                        </Text>
                                    </TouchableOpacity>  
                                </View>
                            </View>
                        }

                    </View>
                    
                {/* </View> */}


                <Message 
                    message={this.state.message} 
                    backgroundColor={this.state.backgroundColor} 
                    visible={this.state.showMessage}
                    duration={5000}
                    onDismiss={() => {
                        this.setState({
                            showMessage: false
                        }, () => {
                            if(this.state.mode == 'reason'){
                                this.setState({
                                    showReasonModal: true
                                })
                            }
                        });
                        
                    }}
                    position={'bottom'}
                    headerTitle="Alert"
                    colorLayout={colorLayout}
                ></Message>


                <AlertComponent 
                    message={this.state.message}
                    placeholder={this.state.placeholder} 
                    visible={this.state.openAlertModal}
                    showCloseBtn={true}
                    onClose={() => {
                        this.setState({
                            openAlertModal: false,
                            showAssetCommentBox: false
                        });
                    }}
                    onCancel={() => {
                        this.setState({
                            openAlertModal: false,
                            showAssetCommentBox: false
                        }, () => {
                            if(this.state.mode == 'back'){
                                if(this.props['userData']['isCategoryScreenEnable'] == true){
                                    this.props['navigation'].navigate('InspectionType', {
                                        props: this.props?.['inspection']['inspection'],
                                        total_category: this.props?.['inspection']['total_categories'],
                                        trans_no: this.props?.['inspection']['trans_no']
                                    });
                                }else{
                                    this.props['navigation'].navigate('InspectionsList', {
                                        props: this.props['inspection']['inspection']
                                    });
                                }
                            }
                        });
                    }}
                    onOk={(asset_comment: string) => {
                        this.setState({
                            openAlertModal: false,
                            showAssetCommentBox: false
                        }, async () => {
                            if(this.state.mode == 'media'){
                                this.setState({
                                    openAlertModal: false,
                                    showAssetCommentBox: false
                                }, () => {
                                    openSettings();
                                })
                            }
                            if(this.state.mode == 'option'){
                                this.removeSelectedChoice();
                            }
                            if(this.state.mode == 'back'){
                                this.createDraft();
                                
                                // const { questions } = this.state;
                                // questions.forEach((c: any) => {
                                //     if(c.audio.length > 0){
                                //         RNFetchBlob.fs.unlink(c.audio[0].path).then(res => {
                                            
                                //         });
                                //     }
                                //     if(c.video.length > 0){
                                //         RNFetchBlob.fs.unlink(c.video[0].uri).then(res => {
                                            
                                //         });
                                //     }
                                //     if(c.photo.length > 0){
                                //         c.photo.forEach((p: any) => {
                                //             RNFetchBlob.fs.unlink(p.uri).then(res => {
                                                
                                //             });
                                //         })
                                //     }
                                // }); 
                                
                            }
                            if(this.state.mode == 'asset_comment'){
                                var assets_list = JSON.parse(JSON.stringify(this.state.assets_list));


                                if(this.state.current_asset){
                                    assets_list.forEach((a_l) => {
                                        if(a_l['assetId'] == (this.state['current_asset'] as any).assetId){
                                            a_l['comment'] = asset_comment;
                                        }
                                    })
                                    
                                    this.setState({
                                        assets_list: assets_list
                                    })
                                }
                                
                            }
                            
                        })
                    }}
                    headerTitle={this.state.alertHerderTitle}
                    okText={this.state.okText}
                    cancelText={this.state.mode == 'back' ? 'No' : 'Close'}
                    showCommentBox={this.state.showAssetCommentBox}
                    commentValue={this.state.assetCommentValue}
                    is_lower={this.state.mode == 'back' ? false : true}
                ></AlertComponent>
                

                {
                    current_question && this.state.showImageModal &&
                    <ImageComponent 
                        length={this.state.maxImage}
                        maxCommentLength={100}
                        intialValue={this.state.current_question ? current_question['photo'] : []}
                        commentValue={''}
                        currentIndexValue={null}
                        isMandatory={selected_choice ? selected_choice.comment : false}
                        visible={true}
                        onClose={() => {
                            this.setState({showImageModal: false});
                        }}
                        onSubmit={(r: any, img_saved: boolean, is_compressed: boolean) => {
                            this.setState({showImageModal: false});
                            // if(r){
                                const { selected_choice }: any = this.state;
                                var ques = JSON.parse(JSON.stringify(this.state.questions));

                                var c_q = JSON.parse(JSON.stringify(this.state.current_question));
                                c_q.photo = r;
                                c_q.imagesSaved = img_saved;
                                c_q.is_compressed = is_compressed;
                                ques[this.state.current_index] = c_q;
                                if(img_saved == true){
                                    if(selected_choice.video == true && c_q.video.length == 0){
                                        this.openVideoCameraModal();
                                    }
                                    else if(selected_choice.audio == true && c_q.audio.length == 0){
                                        this.openAudioModal();
                                    }
                                }

                                this.setState({
                                    questions: ques,
                                    current_question: c_q
                                });
                            // }
                        }}
                        qCategoryID={current_question['qcategoryid']}
                        sTypeId={this.state.inspection ? this.state.inspection?.['sTypeId'] : ''}
                        inspectionId={this.state.inspection ? this.state.inspection['data']['inspectionId'] : ''}
                        siteID={this.state.inspection ? this.state.inspection?.['siteID'] : ''}
                        siteCode={this.state.inspection ? this.state.inspection?.['siteCode'] : ''}
                        questionID={current_question['questionID']}
                        imagesSaved={this.state.questions[this.state.current_index] ? this.state.questions[this.state.current_index]['imagesSaved'] : false}
                        is_compressed={this.state.questions[this.state.current_index] ? this.state.questions[this.state.current_index]['is_compressed'] : false}
                        gpsCoordinate={this.state.gpsCoordinate}
                        trans_no={this.props?.['inspection']['trans_no']}
                        categoryName={current_question['qcategoryName']}
                        inspectionName={this.props?.['inspection']['inspection']['data']['sname']}
                    />
                }


                {
                    current_question && this.state.showAudioModal &&
                    <AudioRecordComponent 
                        length={this.state.audioTime}
                        intialValue={this.state.current_question ? current_question['audio'] : []}
                        commentValue={''}
                        currentIndexValue={null}
                        visible={true}
                        onClose={() => {
                            this.setState({showAudioModal: false});
                        }}
                        onSubmit={(r: any, audioLength: number, recordingSaved:boolean) => {

                            const { selected_choice }: any = this.state;

                            this.setState({showAudioModal: false});
                            var ques = JSON.parse(JSON.stringify(this.state.questions));
                            var c_q = JSON.parse(JSON.stringify(this.state.current_question));
                            c_q.audio = r;
                            c_q.audioLength = audioLength;
                            c_q.recordingSaved = recordingSaved;
                            ques[this.state.current_index] = c_q;
                            this.setState({
                                questions: ques,
                                current_question: c_q
                            });
                            if(audioLength > 0 && recordingSaved == true){
                                if(selected_choice.video == true && c_q.video.length == 0){
                                    this.openVideoCameraModal();
                                }
                                else if(selected_choice.photo == true && c_q.photo.length == 0){
                                    this.openImageCameraModal();
                                }
                            }
                            
                        }}
                        audioStart={'00:00:00'}
                        playaudio={false}
                        audioRecording={null}
                        recordingSaved={this.state.current_question ? current_question['recordingSaved'] : false}
                        qCategoryID={current_question['qcategoryid']}
                        sTypeId={this.state.inspection ? this.state.inspection?.['sTypeId'] : ''}
                        inspectionId={this.state.inspection ? this.state.inspection['data']['inspectionId'] : ''}
                        siteID={this.state.inspection ? this.state.inspection?.['siteID'] : ''}
                        questionID={this.state.current_question ? current_question['questionID'] : 0}
                        recordedAudioLength={this.state.current_question ? current_question['audioLength'] : 0}
                        gpsCoordinate={this.state.gpsCoordinate}
                        trans_no={this.props['route'].params.trans_no}
                    />
                }

                {
                    current_question && this.state.showVideoModal &&
                    <VideoComponent 
                        length={this.state.videoTime}
                        intialValue={this.state.questions[this.state.current_index] ? this.state.questions[this.state.current_index]['video'][0] : this.state.questions[this.state.current_index]}
                        commentValue={''}
                        currentIndexValue={null}
                        flash={false}
                        playvideo={false}
                        videoRecording={null}
                        paused={false}
                        videoStart={'00:00:00'}
                        visible={true}
                        onClose={(file_name: string) => {
                            this.setState({showVideoModal: false});
                        }}
                        onSubmit={(r: any, videoLength: number, isSaved: boolean) => {


                            const { selected_choice }: any = this.state;

                            this.setState({showVideoModal: false});
                            // if(r){

                                var ques = JSON.parse(JSON.stringify(this.state.questions));
                                var c_q = JSON.parse(JSON.stringify(this.state.current_question));
                                c_q.video = r ? r.uri ? [r] : [] : [];
                                c_q.videoLength = videoLength;
                                c_q.videoSaved = isSaved;

                                ques[this.state.current_index] = c_q;
                                this.setState({
                                    questions: ques,
                                    current_question: c_q
                                });

                                if(videoLength > 0 && isSaved == true){
                                    if(selected_choice.audio == true && c_q.audio.length == 0){
                                        this.openAudioModal();
                                    }
                                    else if(selected_choice.photo == true && c_q.photo.length == 0){
                                        this.openImageCameraModal();
                                    }
                                }

                            // }

                        }}
                        qCategoryID={current_question['qcategoryid']}
                        sTypeId={this.state.inspection ? this.state.inspection?.['sTypeId'] : ''}
                        inspectionId={this.state.inspection ? this.state.inspection['data']['inspectionId'] : ''}
                        siteID={this.state.inspection ? this.state.inspection?.['siteID'] : ''}
                        questionID={current_question['questionID']}
                        recordedVideoLength={this.state.questions[this.state.current_index] ? this.state.questions[this.state.current_index]['videoLength'] : 0}
                        videoSaved={this.state.questions[this.state.current_index] ? this.state.questions[this.state.current_index]['videoSaved'] : false}
                        gpsCoordinate={this.state.gpsCoordinate}
                        trans_no={this.props['route'].params.trans_no}
                        testme={(data: any) => {
                            var ques = JSON.parse(JSON.stringify(this.state.questions));
                            var c_q = JSON.parse(JSON.stringify(this.state.current_question));
                            c_q.testme_video_data = data;

                            ques[this.state.current_index] = c_q;
                            this.setState({
                                questions: ques,
                                current_question: c_q
                            });
                        }}
                        set_video_modal_state={(data: any) => {
                            var ques = JSON.parse(JSON.stringify(this.state.questions));
                            var c_q = JSON.parse(JSON.stringify(this.state.current_question));
                            c_q.video_modal_state = data;

                            ques[this.state.current_index] = c_q;
                            this.setState({
                                questions: ques,
                                current_question: c_q
                            });
                        }}
                        video_modal_state={this.state.questions[this.state.current_index] ? this.state.questions[this.state.current_index]['video_modal_state'] : this.state.questions[this.state.current_index]}
                        testme_video_data={this.state.questions[this.state.current_index] ? this.state.questions[this.state.current_index]['testme_video_data'] : this.state.questions[this.state.current_index]}
                    />
                }


                {
                    this.state.questions && this.state.showReasonModal &&
                    <ReasonComponent
                        intialValue={this.state.questions[this.state.current_index]['reason']}
                        visible={this.state.all_reasons.filter((re: any) => re.qCategoryId == (this.state.inspection ? current_question['qcategoryid'] : '')).length > 0 ? this.state.showReasonModal : false}
                        onClose={(r) => {
                            this.setState({
                                showReasonModal: false
                            });
                            if(r){
                                var ques = JSON.parse(JSON.stringify(this.state.questions));
                                var c_q = JSON.parse(JSON.stringify(this.state.current_question));

                                c_q.reason = r;
                                ques[this.state.current_index] = c_q;
                                this.setState({
                                    questions: ques,
                                    current_question: c_q
                                });
                            }
                        }}
                        qCategoryID={current_question['qcategoryid']}
                        reasons={this.getReasons(this.state.questions[this.state.current_index]['reason'], JSON.parse(JSON.stringify(this.state.all_reasons)), this.state.inspection ? current_question['qcategoryid'] : '')}
                    />
                }

            </Wrapper>
        );
    }
}

const styles = StyleSheet.create({

    
});

const mapStateToProps = ({ auth }) => {
    return ({
        userData: auth.userData,
        inspectedSurvey: auth.inspectedSurvey,
        colorLayout: auth.colorLayout,
        questions: auth.questions,
        inspection: auth.inspection,
        userCategoryQuestions: auth.userCategoryQuestions
    });
};

const ActionCreators = Object.assign(
    { userData },
    { inspectedSurvey },
    { setQuestions },
    { setInspection }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Question);
