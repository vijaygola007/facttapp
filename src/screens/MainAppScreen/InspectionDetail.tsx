import React, { PureComponent, useRef } from 'react';
import { 
    StyleSheet,
    View,
    Text,
    Dimensions,
    ScrollView,
    LogBox,
    ActivityIndicator
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'react-native-elements';
import NetInfo from "@react-native-community/netinfo";

import Spinner from 'react-native-loading-spinner-overlay';
import crashlytics from '@react-native-firebase/crashlytics';

import { userData, colorLayout } from '../../store/actions';
import { getService, SendErrorLog } from '../../api-services';
import { urls, hexToRgbA, MEDIA_TYPE } from '../../utilities/constants';

import { Connectivity } from '../../components/common';
import { getLocalUserData } from '../../utilities/helperFunctions';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

class InspectionDetail extends PureComponent {

    constructor(props) {
        super(props);
    }

    state = {
        registration_code: '',
        showMessage: false,
        visible: false,
        message: '',
        inspection: this.props['route'].params.props,
        detail: this.props['route'].params.props,
        spinner: true
    };

    componentDidMount() {
        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
        
        var path = `mobile/inspections/${this.state.inspection.inspectionNo}/data`;
        if(this.state.detail.detail){
            this.setState({
                spinner: false
            });
        }

        getService(path)
        .then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => InspectionDetail > Method => componentDidMount @ api => '+urls.layout, 'Error While getting inspection detail');
                }
            }
            if(res.responseCode == 2000){
                this.setState({
                    inspection: res.responseData
                })
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
            this.setState({
                detail: res.responseCode == 2000 ? res.responseData : {}
            });
            setTimeout(() => {
                this.setState({
                    spinner: false
                })
            }, 500);
        }, (err) => {
            SendErrorLog('Screen => InspectionDetail > Method => componentDidMount @ api => '+path, err.message);
            setTimeout(() => {
                this.setState({
                    spinner: false
                })
            }, 500);
        })
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

    render() {

        const { colorLayout } = this.props as any;
        const { detail } = this.state;

        return (
            <View
                style={{flex: 1, backgroundColor: colorLayout.appBgColor}}
            >
                <View 
                    style={{
                        backgroundColor: colorLayout.subHeaderBgColor,
                        paddingHorizontal: 12,
                        height: 60,
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        alignItems: 'center'
                    }}
                >
                    <View>
                        <Text
                            style={{
                                color: colorLayout.headerTextColor,
                                fontSize: 12,
                                fontWeight: '600',
                                textAlignVertical: 'center'
                            }}
                        >
                            {this.state.inspection.inspectionCode ? '('+this.state.inspection.inspectionCode+')' : '--'}
                        </Text>
                        <Text
                            style={{
                                fontSize: 16,
                                color: colorLayout.headerTextColor,
                                fontWeight: '600',
                                marginTop: 4,
                                textAlignVertical: 'center'
                            }}
                        >
                            {this.state.inspection.inspectionName ? this.state.inspection.inspectionName : '--'}
                        </Text>
                    </View>
                </View>

                <View
                    style={{
                        backgroundColor: colorLayout.appBgColor,
                        paddingVertical: 15,
                        paddingHorizontal: 12,
                    }}
                >

                    <Text
                        style={{
                            color: colorLayout.appTextColor,
                            fontWeight: '600'
                        }}
                    >
                        {this.state.inspection.siteCode ? '('+this.state.inspection.siteCode+')' : '--'}
                    </Text>

                    <Text
                        style={{
                            marginTop: 3,
                            fontSize: 16,
                            color: colorLayout.appTextColor,
                            fontWeight: '600'
                        }}
                    >
                        {this.state.inspection.siteName ? this.state.inspection.siteName : '--'}
                    </Text>

                    <Text
                        style={{
                            fontSize: 13,
                            color: colorLayout.subTextColor,
                            marginTop: 6,
                            fontWeight: '400'
                        }}
                    >
                        {this.state.detail.siteAddress ? this.state.detail.siteAddress : '-'}
                    </Text>
                    
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                        }}
                    >

                    <View
                        style={{
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            marginTop: 10
                        }}
                    >

                        <View>

                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: '400',
                                    color: colorLayout.subTextColor
                                }}
                            >
                                Inspected No
                            </Text>

                            <Text
                                style={{
                                    fontSize: 12,
                                    color: colorLayout.subTextColor,
                                    marginTop: 2,
                                    fontWeight: '600'
                                }}
                            >
                                {this.state.inspection.inspectionNo ? this.state.inspection.inspectionNo : '--'}
                            </Text>

                        </View>

                        <View
                            style={{
                                marginTop: 15
                            }}
                        >

                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: '400',
                                    color: colorLayout.subTextColor
                                }}
                            >
                                Inspected By
                            </Text>

                            <Text
                                style={{
                                    fontSize: 12,
                                    color: colorLayout.subTextColor,
                                    marginTop: 2,
                                    fontWeight: '600'
                                }}
                            >
                                {this.state.inspection.inspectedBy ? this.state.inspection.inspectedBy : '--'}
                            </Text>

                        </View>

                    </View>

                    <View
                        style={{
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            marginTop: 10
                        }}
                    >

                        <View>

                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: '400',
                                    color: colorLayout.subTextColor
                                }}
                            >
                                Inspected On
                            </Text>

                            <Text
                                style={{
                                    fontSize: 12,
                                    color: colorLayout.subTextColor,
                                    marginTop: 2,
                                    fontWeight: '600'
                                }}
                            >
                                {this.state.inspection.inspectedOn ? this.state.inspection.inspectedOn : '--'}
                            </Text>

                        </View>

                        <View>

                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: '400',
                                    color: colorLayout.subTextColor
                                }}
                            >
                                Status
                            </Text>

                            <Text
                                style={{
                                    fontSize: 12,
                                    color: colorLayout.subTextColor,
                                    marginTop: 2,
                                    fontWeight: '600'
                                }}
                            >
                                {this.state.inspection.inspectionStatus ? this.state.inspection.inspectionStatus : '--'}
                            </Text>

                        </View>

                    </View>
                    </View>

                </View>

                {
                    !this.state.spinner && !detail.detail &&
                    <View
                        style={{
                            flex: 1,
                        }}
                    >
                        <Text
                            style={{
                                flex: 1,
                                textAlign: 'center',
                                textAlignVertical: 'center',
                                color: '#000'
                            }}
                        >
                            No Inspection Detail   
                        </Text>
                    </View>
                }

                {
                    this.state.detail.detail
                    &&
                    <ScrollView
                        style={{...styles.container, backgroundColor: colorLayout.appBgColor, marginBottom: 30}}
                        keyboardShouldPersistTaps={'handled'}
                        scrollEventThrottle={10000}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                    >

                        {
                            detail.inspections_list.map((ins: any, ins_index: number) => {
                                return ins.map((d: any, index: number) => {
                                    return (
                                        <View
                                            style={{...styles.historyView}}
                                            key={index}
                                        >
                                                
                                            <View
                                                style={{
                                                    overflow: 'hidden',
                                                    borderRadius: 5,
                                                    borderWidth: 0.2,
                                                    borderColor: '#d3d3d3',
                                                    backgroundColor: colorLayout.appBgColor
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 16,
                                                        fontWeight: '900',
                                                        backgroundColor: colorLayout.headerBgColor,
                                                        paddingVertical: 6,
                                                        paddingLeft: 10,
                                                        color: colorLayout.headerTextColor,
                                                        display: index == 0 ? 'flex' : 'none',
                                                        textAlignVertical: 'center'
                                                    }}
                                                >
                                                    {d.qCategory}
                                                </Text>
    
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            paddingLeft: 15,
                                                            color: colorLayout.appTextColor,
                                                            paddingVertical: 10,
                                                            marginRight: 5,
                                                            textAlignVertical: 'center'
                                                        }}
                                                    >
                                                        Q.{index + 1}
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            color: colorLayout.appTextColor,
                                                            // paddingVertical: 15,
                                                            flex: 1,
                                                            paddingRight: 10,
                                                            // lineHeight: 16,
                                                            textAlignVertical: 'center'
                                                        }}
                                                    >
                                                        {d.qText}
                                                    </Text>
                                                </View>
    
                                                <View
                                                    style={{
                                                        borderBottomColor: colorLayout.appTextColor,
                                                        borderBottomWidth: 1,
                                                        opacity: 0.2,
                                                        width: screenWidth*0.86,
                                                        alignSelf: 'center',
                                                    }}
                                                >
                                                </View>
    
                                                <View
                                                    style={{
                                                        marginTop:15,
                                                        paddingHorizontal: 15,
                                                        paddingBottom: 15
                                                    }}
                                                >
    
                                                    <View
                                                        style={{
                                                            flexDirection: 'row',
                                                            justifyContent: 'space-between',
                                                            display: (d.qTypeCode == "MO" || d.qTypeCode == "AQ") ? 'none' : 'flex'
                                                        }}
                                                    >
    
                                                       
    
                                                        <View
                                                            style={{
                                                                flex: 1,
                                                                flexDirection: 'row',
                                                            }}
                                                        >
    
                                                            <Text
                                                                style={{
                                                                    color: colorLayout.subTextColor,
                                                                    marginLeft: 10,
                                                                    fontWeight: '600',
                                                                    flex: 1
                                                                }}
                                                            >
                                                                {d.choice}
                                                            </Text>
                                                        </View>
    
                                                    </View>

                                                    {
                                                        d.qTypeCode == "MO" &&
                                                        <View>
                                                            {
                                                                d.reasons.map((r: string) => {
                                                                    return (
                                                                        <Text
                                                                            style={{
                                                                                color: colorLayout.subTextColor,
                                                                                marginLeft: 10,
                                                                                fontWeight: '400',
                                                                                flex: 1
                                                                            }}
                                                                        >
                                                                            <Icon
                                                                                name={'circle'}
                                                                                type='font-awesome-6'
                                                                                color={colorLayout.subHeaderBgColor}
                                                                                containerStyle={{
                                                                                }}
                                                                                iconStyle={{
                                                                                    fontSize: 8,
                                                                                    marginRight: 4
                                                                                }}
                                                                                    
                                                                            />
                                                                            {r}
                                                                        </Text>
                                                                    );
                                                                })
                                                            }
                                                        </View>
                                                    }
    
                                                    <View
                                                        style={{
                                                            flexDirection: 'row',
                                                            justifyContent: 'space-between',
                                                            display: d.qComment ? 'flex' : 'none',
                                                            marginTop: 10,
                                                            paddingLeft: 10
                                                        }}
                                                    >
    
                                                        <Text
                                                            style={{
                                                                opacity: 0.7,
                                                                fontWeight: '300',
                                                                flex: 0.4
                                                            }}
                                                        >
                                                            Comment
                                                        </Text>
    
                                                        <View
                                                            style={{
                                                                flex: 1,
                                                                flexDirection: 'row'
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    opacity: 0.7,
                                                                    fontWeight: '300',
                                                                }}
                                                            >
                                                                :
                                                            </Text>
    
                                                            <Text
                                                                style={{
                                                                    color: colorLayout.appTextColor,
                                                                    marginLeft: 10
                                                                }}
                                                            >
                                                                {d.qComment}
                                                            </Text>
                                                        </View>
    
                                                    </View>

                                                    {
                                                        d.assetValue.length > 0 &&
                                                        <View
                                                            style={{
                                                                flexDirection: 'row',
                                                                justifyContent: 'space-between',
                                                                padding: 5,
                                                                backgroundColor: colorLayout.subHeaderBgColor
                                                            }}
                                                        >


                                                            <View style={{flex: 1}}>
                                                                <Text style={{color: colorLayout.headerTextColor, fontWeight: '600'}}>
                                                                    Asset Name
                                                                </Text>
                                                            </View>

                                                            <View style={{flex: 0.5, alignItems: 'center'}}>
                                                                <Text style={{color: colorLayout.headerTextColor, fontWeight: '600', textAlign: 'center'}}>
                                                                    Old Count
                                                                </Text>
                                                            </View>

                                                            <View style={{flex: 0.5, alignItems: 'center'}}>
                                                                <Text style={{color: colorLayout.headerTextColor, fontWeight: '600', textAlign: 'center'}}>
                                                                    New Count
                                                                </Text>
                                                            </View>
                                                            

                                                            <View style={{flex: 1}}>
                                                                <Text style={{color: colorLayout.headerTextColor, fontWeight: '600'}}>
                                                                    Comment
                                                                </Text>
                                                            </View>
                                                        
                                                        </View>
                                                    }

                                                    {
                                                        d.assetValue.map((asset: any) => {
                                                            return (
                                                                <View
                                                                    style={{
                                                                        flexDirection: 'row',
                                                                        justifyContent: 'space-between',
                                                                        padding: 5,
                                                                        borderBottomWidth: 1,
                                                                        borderBottomColor: '#d3d3d3'
                                                                    }}
                                                                >


                                                                    <View style={{flex: 1}}>
                                                                        <Text style={{color: colorLayout.subTextColor, ...styles.assets}}>
                                                                            {asset.assetValue}
                                                                        </Text>
                                                                    </View>

                                                                    <View style={{flex: 0.5, alignItems: 'center'}}>
                                                                        <Text style={{color: colorLayout.subTextColor, ...styles.assets, textAlign: 'center'}}>
                                                                            {asset.assetCount}
                                                                        </Text>
                                                                    </View>

                                                                    <View style={{flex: 0.5, alignItems: 'center'}}>
                                                                        <Text style={{color: colorLayout.subTextColor, ...styles.assets, textAlign: 'center'}}>
                                                                            {asset.assetActualCount}
                                                                        </Text>
                                                                    </View>
                                                                    

                                                                    <View style={{flex: 1}}>
                                                                        <Text style={{color: colorLayout.subTextColor, ...styles.assets, textAlign: asset.comment ? 'left' : 'center'}}>
                                                                            {asset.comment ? asset.comment : '--'}
                                                                        </Text>
                                                                    </View>
                                                                
                                                                </View>
                                                            );
                                                        })
                                                    }
    
                                                    <View
                                                        style={{
                                                            flexDirection: 'row',
                                                            justifyContent: 'space-between',
                                                            marginTop: 10,
                                                            display: d.additionalDataList.length > 0 ? 'flex' : 'none'
                                                        }}
                                                    >
    
                                                        {/* <Text
                                                            style={{
                                                                opacity: 0.7,
                                                                fontWeight: '300',
                                                                flex: 0.4
                                                            }}
                                                        >
                                                            Evidence
                                                        </Text> */}
    
                                                        <View
                                                            style={{
                                                                flex: 1,
                                                                flexDirection: 'row'
                                                            }}
                                                        >
                                                            {/* <Text
                                                                style={{
                                                                    opacity: 0.7,
                                                                    fontWeight: '300',
                                                                }}
                                                            >
                                                                :
                                                            </Text> */}
    
                                                            <View
                                                                style={{
                                                                    flexDirection: 'row',
                                                                    justifyContent: 'space-between',
                                                                    // alignSelf: 'center',
                                                                    marginLeft: 10
                                                                }}
                                                            >
                                                                {
                                                                    d.media.map((o: any, o_index: number) => {
                                                                        return (
                                                                            <View
                                                                                style={{
                                                                                    flexDirection: 'row',
                                                                                    justifyContent: 'space-between',
                                                                                }}
                                                                                key={o_index}
                                                                            >
                                                                                {/* <Text style={{color: colorLayout.appTextColor, marginTop: 2, fontWeight: '400'}}>
                                                                                    {o}
                                                                                </Text>
                                                                                <Icon
                                                                                    name='checkmark-circle'
                                                                                    type='ionicon'
                                                                                    color="#228B22"
                                                                                    containerStyle={{
                                                                                        marginLeft: 5, 
                                                                                        alignSelf: 'center'
                                                                                    }}
                                                                                    iconStyle={{
                                                                                        fontSize: 20,
                                                                                    }}
                                                                                    
                                                                                /> */}

                                                                                <Icon
                                                                                    name={o == 'Audio' ? 'microphone' : (o == 'Video' ? 'video-camera' : 'camera')}
                                                                                    type='font-awesome'
                                                                                    color={colorLayout.subHeaderBgColor}
                                                                                    containerStyle={{
                                                                                        
                                                                                    }}
                                                                                    iconStyle={{
                                                                                        fontSize: 24,
                                                                                    }}
                                                                                     
                                                                                />
    
                                                                                <Text 
                                                                                    style={{
                                                                                        color: colorLayout.appTextColor, 
                                                                                        fontWeight: '600', 
                                                                                        marginHorizontal: 12, 
                                                                                        display : d.media[o_index + 1] ? 'flex' : 'none'
                                                                                    }}
                                                                                >|</Text>
    
                                                                            </View>
                                                                        );
                                                                    })
                                                                }
    
                                        
                                                            </View>
                                                        </View>
    
                                                    </View>
    
    
                                                </View>
                                            </View>
    
                                        </View>
                                    );
                                })
                            })
                            
                        }


                    </ScrollView>
                }

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


                {/* <Connectivity {...this.props} /> */}

            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginBottom: 0,
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
        margin: 12,
        borderRadius: 10,
        elevation: 4
    },
    assets: {
        fontWeight: '600',
    }
});

const mapStateToProps = ({auth}) => {
    return ({
        userData: auth.userData,
        colorLayout: auth.colorLayout
    });
};

const ActionCreators = Object.assign(
    { userData }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(InspectionDetail);
