import React, { PureComponent, useRef } from 'react';
import { 
    StyleSheet,
    View,
    Text,
    Dimensions,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    LogBox,
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'react-native-elements';

import Spinner from 'react-native-loading-spinner-overlay';
import crashlytics from '@react-native-firebase/crashlytics';


import { userData } from '../../store/actions';
// database
import * as storage from '../../db';

import { urls, hexToRgbA, InfiniteScroll, MEDIA_TYPE } from '../../utilities/constants';
import { getLocalUserData } from '../../utilities/helperFunctions';
import { getService, SendErrorLog } from '../../api-services';
import { CARD_BORDER_RADIUS } from '../../layout/wrapper';

const screenWidth = Dimensions.get('screen').width;
const screenHeight = Dimensions.get('window').height;

const color = {
    danger: '#CD3D3E',
    warning: '#EB9D3E',
    success: '#4DAD49',
    info: '#4CB3D5',
    default: '#565656'
}

class InspectionReport extends PureComponent {

    constructor(props) {
        super(props);
    }

    state = {
        registration_code: '',
        showMessage: false,
        visible: false,
        message: '',
        sites: [],
        inspections_data: [],
        inspections_all_data: [],
        inspections_all_data_copy: [],
        spinner: true,
        limit: 10,
        offset: 0,
        showActivityLoader: true,
    };

    componentDidMount() {
        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
        
        this.fetchAllData();
        setTimeout(() => {
            this.setState({
                spinner: false
            });
        }, 500);

        getService(urls.inspections).then((res: any) => {
            if(res){
                if(res.responseCode == 5001 || res.responseCode == 5002){
                    SendErrorLog('Screen => InspectionReport > Method => componentDidMount @ api => '+urls.layout, 'Error While getting inspection data');
                }
            }
            if(res.responseCode == 2000){
                if(res['responseData'].length > 0){
                    var inspections_data = res.responseCode == 2000 ? res.responseData : [];
                    storage.insertInspectionsData_TBL(inspections_data);
                    this.setState({
                        inspections_all_data: inspections_data,
                        inspections_all_data_copy: inspections_data,
                        inspections_data: JSON.parse(JSON.stringify(inspections_data)).slice(0, 10),
                        offset: 0
                    });
                }
            }
            
        }).catch((error) => {
            SendErrorLog('Screen => InspectionReport > Method => componentDidMount @ api => '+urls.inspections, error.message);
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

    fetchAllData(){
        storage.runQuery(`select * from ${storage.inspections_tbl}`).then((res: any) => {
            this.setState({
                inspections_all_data: res,
                inspections_all_data_copy: res,
                inspections_data: res.slice(0, 10),
                offset: 0
            }, () => {
                
            });
        });
    }

    fetchChunkedData(){
        var inspections_clone = JSON.parse(JSON.stringify(this.state.inspections_data));
        var res = JSON.parse(JSON.stringify(this.state.inspections_all_data_copy)).slice(this.state.offset, this.state.offset + 10);
        res.forEach((s: any) => {
            inspections_clone.push(s);
        });
        this.setState({
            inspections_data: inspections_clone
        });
    }

    render() {
        const { colorLayout } = this.props as any;

        return (
            <View
                style={{
                    flex: 1
                }}
            >

                <View
                    style={{
                        flexDirection: 'row',
                        marginVertical: 10,
                        width: screenWidth,
                        height: 16
                    }}
                >

                    <View
                        style={{
                            flexDirection: 'row',
                            paddingHorizontal: 12,
                        }}
                    >
                        <Icon
                            name='circle'
                            type='fontawesome'
                            color='#228B22'
                            iconStyle={{
                                fontSize: 14,
                            }}
                            
                        />
                        <Text
                            style={{
                                marginLeft: 5,
                                fontSize: 12,
                                fontWeight: '300'
                            }}
                        >
                            COMPLETED
                        </Text>

                        <Icon
                            name='circle'
                            type='fontawesome'
                            color='#fb9224'
                            containerStyle={{
                                marginLeft: 25
                            }}
                            iconStyle={{
                                fontSize: 14,
                            }}
                            
                        />
                        <Text
                            style={{
                                marginLeft: 5,
                                fontSize: 12,
                                fontWeight: '300'
                            }}
                        >
                            PARTIALLY COMPLETED
                        </Text>

                    </View>


                </View>

                {
                    this.state.inspections_data.length == 0 && !this.state.spinner &&
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            // backgroundColor: colorLayout.cardBgColor,
                            alignItems: 'center',
                            flex: 1
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: '500',
                                color: colorLayout.color_2,
                            }}
                        >
                            No inspection report
                        </Text>
                    </View>
                }

                {
                    this.state.inspections_data.length > 0 &&
                    <ScrollView
                    style={{...styles.container, backgroundColor: colorLayout.appBgColor}}
                    keyboardShouldPersistTaps={'handled'}
                    onScroll={(event) => {
                        if(InfiniteScroll(event)){
                            if(this.state.offset > this.state.inspections_all_data_copy.length){
                                this.setState({
                                    showActivityLoader: false
                                })
                                return;
                            }
                            this.setState({
                                offset: (this.state.offset + 10),
                            }, () => {
                                setTimeout(() => {
                                    this.setState({
                                        showActivityLoader: false
                                    }, () => {
                                        this.fetchChunkedData();
                                    })
                                }, 100);
                            })
                        }
                    }}
                    scrollEventThrottle={10000}
                >
                    
    
                    {
                        this.state.inspections_data.map((a, index) => {
                            return (
                                <View
                                    style={{
                                        marginBottom: (index == this.state.inspections_all_data_copy.length - 1) ? 50 : 10,
                                        borderRadius: CARD_BORDER_RADIUS,
                                        marginHorizontal: 10,
                                        shadowColor: '#000',
                                        shadowOffset: {
                                            width: 0,
                                            height: 2
                                        },
                                        shadowOpacity: 0.4,
                                        shadowRadius: 3,
                                        elevation: 4,
                                        marginTop: index == 0 ? 10 : 0
                                    }}
                                    key={index}
                                >
                                    
                                    <TouchableOpacity
                                        onPress={() => {
                                            this.props['navigation'].navigate('InspectionDetail', {
                                                props: a,
                                            })
                                        }}
                                        activeOpacity={1}
                                    >
    
                                        <View
                                            style={{
                                                ...styles.historyView, 
                                                overflow: 'hidden', 
                                                borderRadius: 10,
                                                backgroundColor: colorLayout.appBgColor
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
                                                    }}
                                                >
                                                    <Icon
                                                        name='circle'
                                                        type='fontawesome'
                                                        color={a['inspectionStatus'] == 'PARTIAL' ? '#fb9224' : '#228B22'}
                                                        containerStyle={{
                                                            
                                                        }}
                                                        iconStyle={{
                                                            fontSize: 14
                                                        }}
                                                        
                                                    />
                                                    <Text
                                                        style={{
                                                            fontSize: 16,
                                                            marginLeft: 15,
                                                            fontWeight: '600',
                                                            textAlignVertical: 'center',
                                                            color: colorLayout.subHeaderBgColor,
                                                        }}
                                                    >
                                                        {a['inspectionNo']}
                                                    </Text>
    
                                                </View>
    
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        
                                                    }}
                                                    activeOpacity={0.8}
                                                >
                                                    <Icon
                                                        name='chevron-forward'
                                                        type='ionicon'
                                                        color={colorLayout.subHeaderBgColor}
                                                        containerStyle={{
                                                            
                                                        }}
                                                        iconStyle={{
                                                            fontSize: 26,
                                                        }}
                                                        
                                                    />
                                                </TouchableOpacity>
    
                                            </View>
    
                                            <View
                                                style={{
                                                    borderBottomColor: colorLayout.subHeaderBgColor,
                                                    borderBottomWidth: 1,
                                                    opacity: 0.5,
                                                    width: screenWidth*0.86,
                                                    alignSelf: 'center',
                                                    marginVertical: 5
                                                }}
                                            >
                                            </View>
    
                                            <View
                                                style={{
                                                    // flexDirection: 'row',
                                                    // justifyContent: 'space-between',
                                                    marginTop:2
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
                                                        Inspection Name
                                                    </Text>
    
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            marginTop: 2,
                                                            color: colorLayout.subTextColor,
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        {a['inspectionName']}
                                                    </Text>
    
                                                </View>
    
                                                <View
                                                    style={{
                                                        marginTop: 10
                                                    }}
                                                >
    
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            fontWeight: '400',
                                                            color: colorLayout.subTextColor
                                                        }}
                                                    >
                                                        Site
                                                    </Text>
    
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            color: colorLayout.subTextColor,
                                                            marginTop: 2,
                                                            fontWeight: '600',
                                                        }}
                                                    >
                                                        {a['siteName']} ({a['siteCode']})
                                                    </Text>
    
                                                </View>
    
                                            <View
                                                style={{
                                                    flexDirection: 'row',
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
                                                            marginTop: 2,
                                                            fontWeight: '600',
                                                            color: colorLayout.subTextColor
                                                        }}
                                                    >
                                                        {a['inspectedOn']}
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
                                                        Inspected By
                                                    </Text>
    
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            marginTop: 2,
                                                            fontWeight: '600',
                                                            color: colorLayout.subTextColor
                                                        }}
                                                    >
                                                        {a['inspectedBy']}
                                                    </Text>
    
                                                </View>
    
                                            </View>
    
                                            </View>
                                        </View>
                                    </TouchableOpacity>
    
                                    {
                                        index == this.state.inspections_data.length - 1 &&
                                        this.state.inspections_data.length !== this.state.inspections_all_data_copy.length &&
    
                                        <ActivityIndicator
                                            style={{
                                                marginBottom: 100,
                                                marginTop: 20
                                            }}
                                        />
                                    }
                                </View>
                            );
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
        // paddingTop: 20
    },
    centeredView: {
        flex: 1,
        zIndex: 2, 
        position: 'absolute',
        alignSelf: 'center',
        paddingTop: screenHeight * 0.35
    },
    historyView: {
        backgroundColor: '#ffffff',
        padding: 10,
        paddingBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 0
        },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 4,
    }
});

const mapStateToProps = (state) => {
    return ({
        userData: state.auth.userData,
        colorLayout: state.auth.colorLayout, 
    });
};

const ActionCreators = Object.assign(
    { userData }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(InspectionReport);
