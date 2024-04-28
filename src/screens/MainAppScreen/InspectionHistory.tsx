import React, { PureComponent, useRef } from 'react';
import { 
    StyleSheet,
    View,
    Text,
    Dimensions,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal as ModalP,
    LogBox,
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'react-native-elements';
import Spinner from 'react-native-loading-spinner-overlay';
import crashlytics from '@react-native-firebase/crashlytics';

import {
    TextField,
} from 'rn-material-ui-textfield';

import { userData, colorLayout } from '../../store/actions';
import { getService, postService, SendErrorLog } from '../../api-services';

import { urls, hexToRgbA, MEDIA_TYPE } from '../../utilities/constants';
import { Message } from '../../components/common';
import { getLocalUserData } from '../../utilities/helperFunctions';

// wrappers
import { Wrapper, ContentWrapper2, PADDING_10, PADDING_6, PADDING_16, BORDER_RADIUS, CARD_BORDER_RADIUS,
    TEXT_SIZE_12, TEXT_SIZE_14, TEXT_SIZE_16, TEXT_SIZE_18, TEXT_SIZE_26, TEXT_SIZE_24, BTN_BORDER_RADIUS,
    SCREEN_WIDTH, BODY_CONTAINER_WIDTH, PADDING_12
} from '../../layout/wrapper';


const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

class InspectionHistory extends PureComponent {

    constructor(props) {
        super(props);
    }

    state = {
        registration_code: '',
        showMessage: false,
        visible: false,
        message: '',
        site: this.props['route'].params.props,
        sites: [],
        selected_site: null,
        email_id: '',
        email_id_filled: true,
        spinner: true,
        mode: '',
        headerTitle: 'Alert',
        OkText: 'Yes',
        showOk: true
    };

    componentDidMount() {
        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
        this.getInspectionHistory(this.state.site.siteID);
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

    getInspectionHistory(siteID: number){
        var path = `mobile/inspections/${siteID}`;
        getService(path).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => InspectionHistory > Method => getInspectionHistory @ api => '+path, 'Error While getting inspection history');
                }
            }
            this.setState({
                sites: res.responseCode == 2000 ? res.responseData : []
            });
            setTimeout(() => {
                this.setState({
                    spinner: false
                })
            }, 500);
        }).catch((error) => {
            SendErrorLog('Screen => InspectionHistory > Method => getInspectionHistory @ api => '+path, error.message);
            setTimeout(() => {
                this.setState({
                    spinner: false
                })
            }, 500);
        });
    }

    sendReport(){
        var post_data = {
            inspectionRefNo: (this.state.selected_site as any).inspectionNo.trim(),
            emailId: this.state.email_id
        }
        postService(urls.email, post_data).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => InspectionHistory > Method => sendReport @ api => '+urls.email+' @ params => '+JSON.stringify(post_data), 'Error While sending mail');
                }
            }
            if(res.responseCode == 2000){
                this.setState({
                    message: 'Your inspection report request submitted, please check your mail',
                    showMessage: true,
                    OkText: 'Ok',
                    headerTitle: 'Mail Inspection Report'
                })
            }else{
                this.setState({
                    message: 'Unable to send report',
                    showMessage: true,
                    OkText: 'Ok'
                })
            }
            this.setState({ visible: false });
        }).catch((error) => {
            SendErrorLog('Screen => InspectionHistory > Method => sendReport @ api => '+urls.email+' @ params => '+JSON.stringify(post_data), error.message);
            this.setState({
                message: 'Unable to send report',
                showMessage: true,
                OkText: 'Ok'
            })
        });
    }

    fetchInspectionData(inspection: any){
        var path = `mobile/inspections/${inspection.inspectionNo}/data`;

        getService(path)
        .then((res: any) => {
            if(res.responseCode == 2000){
                if(res.responseData.detail){
                    
                    var category = res.responseData.detail.map((q) => q.qCategory).filter((v, i, a) => a.indexOf(v) === i)
                    res.responseData.detail.forEach((d: any) => {
                        d.media = [];

                        d.additionalDataList.map((f) => f.fileType).filter((v, i, a) => {
                            return a.indexOf(v) === i;
                        }).forEach((m: any) => {
                            d.media.push(MEDIA_TYPE[m.trim().toLowerCase()]);
                        });
                    });
                    res.responseData.inspections_list = [];
                    category.forEach((c: any) => {
                        res.responseData.inspections_list.push(res.responseData.detail.filter((d: any) => d.qCategory.trim().toLowerCase() == c.trim().toLowerCase()))
                    })
                }
            }
            this.props['navigation'].navigate('InspectionDetail', {
                props: res.responseCode == 2000 ? res.responseData : {},
            })
        }, (err) => {
            SendErrorLog('Screen => InspectionHistory > Method => fetchInspectionData @ api => '+path, err.message);
            this.props['navigation'].navigate('InspectionDetail', {
                props: inspection,
            });
        })
    }

    render() {
        const { colorLayout, userData } = this.props as any;
        return (
            <Wrapper
     
                containerStyle={{
                    padding: 0
                }} 
                colorLayout={colorLayout}
                hasHeader={true}
                disableKeyboardBottom={false}
            >
                {/* <ContentWrapper2
                    style={{
                        paddingHorizontal: 0,
                    }}
                    colorLayout={colorLayout}
                > */}
                    <View 
                        style={{
                            backgroundColor: colorLayout['subHeaderBgColor'],
                            padding: PADDING_10
                        }}
                    >
                        <Text
                            style={{
                                color: colorLayout.headerTextColor,
                                fontSize: TEXT_SIZE_16,
                                fontWeight: '600',
                                textAlignVertical: 'center'
                            }}
                        >
                            {this.state.site.sType}
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
                            ({this.state.site.siteCode})
                        </Text>

                        <Text
                            style={{
                                fontSize: TEXT_SIZE_16,
                                fontWeight: '600',
                                color: colorLayout.appTextColor,
                            }}
                        >
                            {this.state.site.siteName}
                        </Text>

                        <Text
                            style={{
                                fontSize: TEXT_SIZE_12,
                                color: colorLayout.subTextColor,
                                paddingVertical: PADDING_6,
                                fontWeight: '400'
                            }}
                        >
                            {this.state.site.siteAddress}
                        </Text>

                        <View
                        style={{
                            flexDirection: 'row',
                            backgroundColor: colorLayout.appBgColor,
                        }}
                    >

                        <View
                            style={{
                                flexDirection: 'row'
                            }}
                        >
                            <Icon
                                name='circle'
                                type='fontawesome'
                                color='#228B22'
                                containerStyle={{
                                }}
                                iconStyle={{
                                    fontSize: TEXT_SIZE_14,
                                }}
                                
                            />
                            <Text
                                style={{
                                    marginLeft: 5,
                                    fontSize: TEXT_SIZE_12,
                                    fontWeight: '400',
                                    color: '#000'
                                }}
                            >
                                COMPLETED
                            </Text>
                        </View>

                        <View
                            style={{
                                flexDirection: 'row'
                            }}
                        >
                            <Icon
                                name='circle'
                                type='fontawesome'
                                color='#fb9224'
                                containerStyle={{
                                    marginLeft: 25
                                }}
                                iconStyle={{
                                    fontSize: TEXT_SIZE_14,
                                }}
                                
                            />
                            <Text
                                style={{
                                    marginLeft: 5,
                                    fontSize: TEXT_SIZE_12,
                                    fontWeight: '400',
                                    color: '#000'
                                }}
                            >
                                PARTIALLY COMPLETED
                            </Text>
                        </View>

                    </View>

                    </View>

                    
                    

                    {
                        this.state.sites.length == 0 && !this.state.spinner &&
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                backgroundColor: colorLayout.appBgColor,
                                flex: 1,
                                alignItems: 'center'
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: TEXT_SIZE_16,
                                    fontWeight: '500',
                                    color: colorLayout.subTextColor,
                                }}
                            >
                                No inspection history
                            </Text>
                        </View>
                    }


                    {
                        this.state.sites.length > 0 &&
                        <ScrollView
                            style={{backgroundColor: colorLayout.appBgColor, flex: 1}}
                            keyboardShouldPersistTaps={'always'}
                        >
                            {
                        this.state.sites.map((a, index) => {
                            return (
                                <View
                                    key={index}
                                >
                                    <View
                                        style={{
                                            ...styles.historyView, 
                                            overflow: 'hidden', 
                                            borderRadius: CARD_BORDER_RADIUS,
                                            backgroundColor: colorLayout['cardBgColor'],
                                            marginHorizontal: PADDING_10,
                                            paddingVertical: PADDING_10,
                                            paddingHorizontal: PADDING_10,
                                            marginBottom: (index==this.state.sites.length-1) ? 100 : 10,
                                            marginTop: index == 0 ? 10 : 0,
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                            }}
                                        >

                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Icon
                                                    name='circle'
                                                    type='fontawesome'
                                                    color={a['inspectionStatus'] == 'PARTIAL' ? '#fb9224' : '#228B22'}
                                                    containerStyle={{
                                                        
                                                    }}
                                                    iconStyle={{
                                                        fontSize: TEXT_SIZE_14
                                                    }}
                                                    
                                                />

                                                <TouchableOpacity
                                                    activeOpacity={1}
                                                    onPress={() => {
                                                        this.fetchInspectionData(a);
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: TEXT_SIZE_16,
                                                            marginLeft: 10,
                                                            fontWeight: '600',
                                                            textAlignVertical: 'center',
                                                            color: colorLayout.subHeaderBgColor
                                                        }}
                                                    >
                                                        {a['inspectionNo']}
                                                    </Text>
                                                </TouchableOpacity>

                                            </View>

                                            

                                            <View
                                                style={{
                                                    flexDirection: 'row'
                                                }}
                                            >
                                            <TouchableOpacity
                                                onPress={() => {
                                                    this.setState({ visible: true, selected_site: a, email_id: '', email_id_filled: true });
                                                }}
                                            >
                                                <Icon
                                                    name='mail-with-circle'
                                                    type='entypo'
                                                    color={colorLayout['subHeaderBgColor']}
                                                    containerStyle={{
                                                        marginHorizontal: PADDING_10
                                                    }}
                                                    iconStyle={{
                                                        fontSize: TEXT_SIZE_26,
                                                    }}
                                                    
                                                />
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => {
                                                    this.fetchInspectionData(a);
                                                }}
                                            >
                                                <Icon
                                                    name='arrow-with-circle-right'
                                                    type='entypo'
                                                    color={colorLayout['subHeaderBgColor']}
                                                    containerStyle={{
                                                        
                                                    }}
                                                    iconStyle={{
                                                        fontSize: TEXT_SIZE_26,
                                                    }}
                                                    
                                                />
                                            </TouchableOpacity>
                                            </View>

                                        </View>
                                        <View
                                            style={{
                                                borderBottomColor: '#131313',
                                                borderBottomWidth: 1,
                                                opacity: 0.2,
                                                width: BODY_CONTAINER_WIDTH - PADDING_16,
                                                alignSelf: 'center',
                                                marginVertical: 5,
                                            }}
                                        >
                                        </View>

                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                marginTop: 2,
                                                flex: 1
                                            }}
                                        >

                                            <View
                                                style={{
                                                    flex: 1,
                                                }}
                                            >

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_12,
                                                        fontWeight: '400',
                                                        color: colorLayout.subTextColor,
                                                    }}
                                                >
                                                    Inspected On
                                                </Text>

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_12,
                                                        color: colorLayout.subTextColor,
                                                        marginTop: 2,
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    {a['auditedOn'] ? (a['auditedOn'] as string).toUpperCase() : ''}
                                                </Text>

                                            </View>

                                            <View
                                                style={{
                                                    flex: 1,
                                                }}
                                            >

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_12,
                                                        fontWeight: '400',
                                                        color: colorLayout.subTextColor,
                                                        textAlign: 'right'
                                                    }}
                                                >
                                                    Inspected By
                                                </Text>

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_12,
                                                        color: colorLayout.subTextColor,
                                                        marginTop: 2,
                                                        textAlign: 'right',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    {a['userName']}
                                                </Text>

                                            </View>

                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    }
                        </ScrollView>
                    }

                {/* </ContentWrapper2> */}

                <ModalP
                    animationType='fade'
                    transparent
                    visible={this.state.visible}
                    onRequestClose={() => {
                        this.setState({ visible: false });
                    }}
                >
                    <View 
                        style={{
                            flex: 1,
                            backgroundColor: '#131313',
                            zIndex: 1,
                            position: 'absolute',
                            height: screenHeight,
                            width: screenWidth,
                            opacity: 0.6
                        }}
                    />

                    <View style={{ ...styles.centeredView }}>
                        <View style={styles.modalView}>
                            <Text
                                style={{
                                color: colorLayout.headerTextColor,
                                fontSize: TEXT_SIZE_16,
                                backgroundColor: colorLayout.subHeaderBgColor,
                                paddingVertical: 10,
                                paddingLeft: 10,
                                borderRadius: 0,
                                marginBottom: 20,
                                marginLeft: -20,
                                marginTop: -20,
                                width: screenWidth * 0.9,
                                borderTopLeftRadius: CARD_BORDER_RADIUS,
                                borderTopRightRadius: CARD_BORDER_RADIUS
                                }}
                            >
                                Mail Inspection Report
                            </Text>

                            <Text style={{...styles.modalInspectionNo, color: colorLayout.subTextColor, fontWeight: '600'}}>
                                Inspection No : 
                                <Text
                                    style={{
                                        fontWeight: '900',
                                        fontSize: TEXT_SIZE_14
                                    }}
                                >
                                    {this.state.selected_site ? ' '+this.state.selected_site['inspectionNo'] : ''}
                                </Text>
                            </Text>

                            <TextField
                                label='Enter your email here'
                                lineWidth={1}
                                value={this.state.email_id}
                                onChangeText={(text: string) => {
                                    this.setState({ email_id: text.slice(0, 50) });
                                }}
                                baseColor={
                                    this.state.email_id ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                                }
                                tintColor={
                                    this.state.email_id ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                                }
                                containerStyle={{
                                    marginBottom: 20,
                                    marginTop: -30
                                }}
                            />

                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center'
                                }}
                            >

                                <TouchableOpacity
                                    style={{
                                        ...styles.modalActionBtn,
                                        backgroundColor: colorLayout.subHeaderBgColor,
                                    }}
                                    onPress={() => {
                                        if(this.state.email_id){
                                            this.sendReport();
                                        }else{
                                            this.setState({ email_id_filled: false });
                                        }
                                    }}
                                >
                                    <Text style={{...styles.openButton, color: colorLayout.headerTextColor, textAlignVertical: 'center'}}>SUBMIT</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    // style={{...styles.openButton}}
                                    style={{
                                        ...styles.modalActionBtn,
                                        backgroundColor: colorLayout.subHeaderBgColor,
                                    }}
                                    onPress={() => {
                                        this.setState({ visible: false });
                                    }}
                                >
                                    <Text style={{...styles.openButton, color: colorLayout.headerTextColor, textAlignVertical: 'center'}}>CANCEL</Text>
                                </TouchableOpacity>

                            </View>
                        </View>
                    </View>
                </ModalP>

                <Message 
                    message={this.state.message} 
                    backgroundColor={''} 
                    visible={this.state.showMessage}
                    duration={5000}
                    onDismiss={() => {
                        this.setState({
                            showMessage: false
                        });
                    }}
                    headerTitle={this.state.headerTitle}
                    OkText={this.state.OkText}
                    showOk={this.state.showOk}
                    colorLayout={colorLayout}
                ></Message>

                {
                    this.state.spinner &&
                    <Spinner
                        visible={true}
                        textContent={''}
                        textStyle={{
                            color: colorLayout['subHeaderBgColor']
                        }}
                        overlayColor={hexToRgbA(colorLayout['appBgColor'])}
                        color={colorLayout['subHeaderBgColor']}
                        indicatorStyle={{

                        }}
                        customIndicator={
                            <ActivityIndicator 
                                style={{
                                    opacity: 1
                                }}
                                size={100}
                                color={colorLayout['subHeaderBgColor']}
                            />
                        }
                    />
                }

            </Wrapper>
        );
    }
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        zIndex: 2, 
        position: 'absolute',
        alignSelf: 'center',
        paddingTop: screenHeight * 0.35
    },
    historyView: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 0
        },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 4,
    },
    modalView: {
        backgroundColor: '#ffffff',
        width: screenWidth * 0.9,
        padding: 20,
        borderRadius: CARD_BORDER_RADIUS
    },
    openButton: {
        fontWeight: '600',
        width: 100,
        textAlign: 'center'
    },
    modalInspectionNo: {
        fontSize: TEXT_SIZE_16,
        fontWeight: '600',
        marginBottom: 20,
    },
    modalActionBtn: {
        marginLeft: 10,
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderRadius: BTN_BORDER_RADIUS,
        marginHorizontal: 5
    }
});

const mapStateToProps = (state) => {
    return ({
        userData: state.auth.userData,
        colorLayout: state.auth.colorLayout,
    });
};

const ActionCreators = Object.assign(
    { userData },
    { colorLayout }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(InspectionHistory);
