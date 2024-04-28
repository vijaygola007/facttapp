import React, { PureComponent } from 'react';
import { 
    StyleSheet,
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    StatusBar,
    LogBox,
    Animated,
    Platform,
    Linking,
    AppState
} from 'react-native';
import NetInfo from "@react-native-community/netinfo";
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'react-native-elements';
import { TextInput } from 'react-native-paper';
import Spinner from 'react-native-loading-spinner-overlay';
import crashlytics from '@react-native-firebase/crashlytics';
import { formatCurrency } from "react-native-format-currency";
import { getVersion } from 'react-native-device-info';

import { userData, colorLayout, allSites } from '../../store/actions';
import { getLocalUserData, getRegistrationData } from '../../utilities/helperFunctions';

// database
import * as storage from '../../db';

import { getService, SendErrorLog } from '../../api-services';
import { hexToRgbA, InfiniteScroll, MONTH_NAME, urls } from '../../utilities/constants';

// wrappers
import { Wrapper, PADDING_10, APP_PADDING, BORDER_RADIUS, CARD_BORDER_RADIUS,
    TEXT_SIZE_12, TEXT_SIZE_14, TEXT_SIZE_16, TEXT_SIZE_18, TEXT_SIZE_10, TEXT_SIZE_26, SCREEN_WIDTH, BODY_BOX_HEIGHT
} from '../../layout/wrapper';
import { AlertComponent } from '../../components/common/Alert';

class VoucherList extends PureComponent {

    inputRef :any;
    _b: any;
    subscribeKeyboardShow: any;
    subscribeKeyboardHide: any;
    _focus_unsubscribe: any;
    _state_subscribe: any;


    state = {
        registration_code: '',
        showMessage: false,
        message: '',
        voucher_data: [],
        voucher_all_data_copy: [],
        search_text: '',
        spinner: true,
        limit: 10,
        offset: 0,
        showActivityLoader: true,
        openDropdown: false,
        animation: new Animated.Value(0),
        expanded: false,
        currencySymbol: '',
        isVersionHigher: false,
        mAppUrl: '',
        okText: 'Yes',
        cancelText: 'No',
        showCancelBtn: true,
        modalMessage: '',
        openModal: false,
        actionType: '',
        messageModalHeaderTitle: ''
    };

    componentDidMount() {

        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
        this.intialize();

        this._focus_unsubscribe = this.props['navigation'].addListener('focus', (e) => {
            this.setState({
                spinner: true
            }, () => {
                this.intialize();
            });
        });
        this._state_subscribe = AppState.addEventListener('change', async nextAppState => {
            if(nextAppState == 'active'){
                this.checkAppVersion();
            }
        });
    }

    async intialize(){
        this.fetchAllData();
        setTimeout(() => {
            this.setState({
                spinner: false
            });
            this.checkAppVersion();
        }, 500);

        const [valueFormattedWithSymbol, valueFormattedWithoutSymbol, symbol] = formatCurrency({ amount: 0.00, code: userData['currencyCode'] ? userData['currencyCode'] : 'INR' })
        this.setState({
            currencySymbol: symbol
        });
    }

    checkAppVersion(){
        getRegistrationData().then((data: any) => {
          
          var currentVersion = getVersion().split('.').map(value => parseInt(value));
          var availableVersion = data.mAppVer.split('.').map(value => parseInt(value));
          var currentIndex = -1;
          var isVersionHigher = false;
          
        //   currentVersion.forEach((num: number, index: number) => {
        //     if(availableVersion[index] > num && currentIndex < index){
        //       currentIndex = index;
        //       isVersionHigher = true;
        //     }
        //   });
        if(availableVersion[0] > currentVersion[0]){
            isVersionHigher = true;
        }else{
            if(availableVersion[1] > currentVersion[1] && availableVersion[0] >= currentVersion[0]){
                isVersionHigher = true;
            }else{
                if(availableVersion[2] > currentVersion[2] && availableVersion[1] >= currentVersion[1] && availableVersion[0] >= currentVersion[0]){
                    isVersionHigher = true;
                }else{
                    isVersionHigher = false;
                }
            }
        }
    
          this.setState({
            openModal: isVersionHigher,
            isVersionHigher: isVersionHigher,
            modalMessage: 'New app version is available, please update app',
            actionType: 'update',
            messageModalHeaderTitle: 'Update App',
            mAppUrl: data.mAppUrl,
            showCancelBtn: false,
            okText: 'Continue'
          });
          
        });
    }


    componentWillUnmount(){
        if(this._focus_unsubscribe){
            this._focus_unsubscribe();
        }
        
        if(this._state_subscribe){
            this._state_subscribe.remove();
        }
    }

    async onCrash(error_log: any) {
        crashlytics().log('Channel manager screen crash analytics');
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
                screen: 'Channel Manager',
                error: error.message,
                user: user ? JSON.stringify(user) : ''
            });
            crashlytics().crash();
        })
    }

    convertDate(date: any, showTime: boolean = false){
        if(!date){
            return '';
        }
        var dt = new Date(date);
        return (dt.getDate() > 9 ? dt.getDate() : '0'+dt.getDate())+'-'+(MONTH_NAME[dt.getMonth()])+'-'+(dt.getFullYear())+(showTime ? ' '+(dt.getHours() > 9 ? dt.getHours() : '0'+dt.getHours())+':'+(dt.getMinutes() > 9 ? dt.getMinutes() : '0'+dt.getMinutes()) : '');
    }

    fetchAllData(){
        getService(urls.voucher_all)
        .then((res: any) => {
            if(res.responseCode == 2000){
                res.responseData.forEach((s: any) => {
                    s['expenseDateCustom'] = this.convertDate(s['expenseDate']);
                    s['createdOnCustom'] = this.convertDate(s['createdOn'], true);
                    s['is_visible'] = true;
                });
                this.setState({
                    voucher_all_data_copy: res.responseData,
                    voucher_data: res.responseData,
                    offset: 0
                });
            }
        }, (err) => {
            SendErrorLog('Screen => VoucherList > Method => fetchAllData @ api => '+urls.voucher_all, err.message);
        })
    }

    search_data(value: string){
        this.setState({
            search_text: value
        }, () => {
            var filter = JSON.parse(JSON.stringify(this.state.voucher_all_data_copy));
            filter.forEach((s: object) => {
                if(
                    (s['voucherNo'] ? s['voucherNo'] : '').toLowerCase().includes(value.toLowerCase().trim()) || 
                    (s['siteCode'] ? s['siteCode'] : '').toLowerCase().includes(value.toLowerCase().trim()) || 
                    (s['siteName'] ? s['siteName'] : '').toLowerCase().includes(value.toLowerCase().trim()) || 
                    (s['contactName'] ? s['contactName'] : '').toLowerCase().includes(value.toLowerCase().trim()) || 
                    (s['contactNo'] ? s['contactNo'] : '').toLowerCase().includes(value.toLowerCase().trim())||  
                    (s['incidentNo'] ? s['incidentNo'] : '').toLowerCase().includes(value.toLowerCase().trim())|| 
                    (s['emailId'] ? s['emailId'] : '').toLowerCase().includes(value.toLowerCase().trim())|| 
                    (s['comment'] ? s['comment'] : '').toLowerCase().includes(value.toLowerCase().trim())|| 
                    (s['amount'] ? s['amount'] : '').toString().includes(value.toLowerCase().trim())|| 
                    (s['qCategoryName'] ? s['qCategoryName'] : '').toLowerCase().includes(value.toLowerCase().trim())
                ){
                    s['is_visible'] = true;
                }else{
                    s['is_visible'] = false;
                }
            });

            this.setState({
                voucher_data: filter.filter((f: any) => f.is_visible).slice(0, 10),
                offset: 0
            });
        });
    }

    goToInspectionList(inspection: any){
        var sql = `select * from ${storage.mobile_data_tbl} where stypeId = ${inspection['sTypeId']}`;
        storage.runQuery(sql).then((res: any) => {
            this.props['navigation'].navigate('InspectionsList', {
                props: inspection
            })
        });
    }

    startAnimation = () => {
        this.setState({
            expanded: !this.state.expanded
        }, () => {
            Animated.timing(this.state.animation, {
                toValue: this.state.expanded ? 1 : 0,
                duration: 500,
                useNativeDriver: false
            }).start();
        })
    }

    render() {
        const { colorLayout, userData } = this.props as any;
        const widthInterpolate = this.state.animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 300]
        })
        const animatedStyle = {
            width: widthInterpolate,
            height: 100
        }
        
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
                <StatusBar
                    backgroundColor={colorLayout.systemHeaderBgColor}
                    barStyle="light-content" translucent={true} 
                />

                    <View
                        style={{
                            width: SCREEN_WIDTH,
                            backgroundColor: colorLayout.cardBgColor,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            zIndex: 1,
                            padding: APP_PADDING,
                            height: 75
                        }}
                    >
                        <TextInput
                            label="Search"
                            mode={'outlined'}
                            ref={(ref) => {
                                this.inputRef = ref;
                                if(ref){
                                    
                                }
                            }}
                            value={this.state.search_text}
                            style={{
                                height: 35,
                                backgroundColor: '#fff',
                                flex: 1,
                                marginTop: -5
                            }}
                            right={
                                <TextInput.Icon
                                    name={() => <Icon 
                                        name={this.state.search_text ? 'close' : 'search'} 
                                        size={24} 
                                        color={colorLayout.subHeaderBgColor} 
                                        onPress={() => {
                                            this.setState({
                                                search_text: ''
                                            })
                                            this.search_data('');
                                        }}
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
                            onChangeText={text => this.search_data(text)}
                            onFocus={() => {
                                this.setState({
                                    openDropdown: true
                                })
                            }}
                            onBlur={() => {
                                this.setState({
                                    openDropdown: false
                                })
                            }}
                        />
                    </View>
                {
                    this.state.voucher_all_data_copy.length == 0 && !this.state.spinner && !this.state.search_text &&
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            flex: 0.8
                        }}
                    >
                        <Text
                            style={{
                                fontSize: TEXT_SIZE_18,
                                textAlignVertical: 'center',
                                width: SCREEN_WIDTH,
                                textAlign: 'center',
                                color: '#000'
                            }}
                        >
                            No vouchers
                        </Text>
                    </View>
                }
                {
                    this.state.voucher_data.length == 0 && !this.state.spinner && this.state.search_text &&
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            height: BODY_BOX_HEIGHT/2
                        }}
                    >
                        <Text
                            style={{
                                fontSize: TEXT_SIZE_18,
                                textAlignVertical: 'center',
                                width: SCREEN_WIDTH,
                                textAlign: 'center',
                                color: '#000'
                            }}
                        >
                            No result for "{this.state.search_text}"
                        </Text>
                    </View>
                }
                {
                    this.state.voucher_data.length == 0 && this.state.spinner &&
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            flex: 1
                        }}
                    >
                        <Text
                            style={{
                                fontSize: TEXT_SIZE_18,
                                textAlignVertical: 'center',
                            }}
                        >
                            Loading...
                        </Text>
                    </View>
                }
                
                {
                    this.state.voucher_all_data_copy.length > 0 &&
                    <ScrollView
                        style={{
                            backgroundColor: colorLayout.appBgColor,
                            // height: BODY_BOX_HEIGHT,
                        }}
                        scrollEventThrottle={10000}
                        scrollEnabled={true}
                    >


                    {
                        this.state.voucher_data.map((a, index) => {
                            return (
                                <View
                                    style={{
                                        marginBottom: (index == this.state.voucher_all_data_copy.length - 1) ? 50 : 10,
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
                                                    justifyContent: 'space-between',
                                                    width: '100%'
                                                }}
                                            >
                                                {/* <Icon
                                                    name='circle'
                                                    type='fontawesome'
                                                    color={a['status'] == 'PENDING' ? '#fb9224' : '#228B22'}
                                                    containerStyle={{
                                                        
                                                    }}
                                                    iconStyle={{
                                                        fontSize: 14
                                                    }}
                                                    
                                                /> */}
                                                <View
                                                    style={{
                                                        flexDirection: 'row'
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 16,
                                                            // marginLeft: 15,
                                                            fontWeight: '600',
                                                            textAlignVertical: 'center',
                                                            color: colorLayout.subHeaderBgColor,
                                                        }}
                                                    >
                                                        {a['voucherNo']} 
                                                        
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            backgroundColor: a['status'] == 'PENDING' ? '#fb9224' : '#228B22',
                                                            color: '#fff',
                                                            fontSize: 12,
                                                            marginHorizontal: 6,
                                                            textAlignVertical: 'center',
                                                            paddingHorizontal: 8,
                                                            borderRadius: 50,
                                                            fontWeight: '600',
                                                            letterSpacing: 1
                                                        }}
                                                    >
                                                        {a['status']}
                                                    </Text>
                                                </View>

                                                <Icon
                                                    name='collections-bookmark'
                                                    type='material-community-icons'
                                                    color={colorLayout.subHeaderBgColor}
                                                    containerStyle={{
                                                        
                                                    }}
                                                    iconStyle={{
                                                        fontSize: 32
                                                    }}
                                                    onPress={()=>{
                                                        this.props['navigation'].navigate('StackNavigator', {
                                                            screen: 'ExpenseDetail',
                                                            params: a
                                                        })
                                                    }}
                                                />

                                            </View>

                                        </View>

                                        <View
                                            style={{
                                                borderBottomColor: colorLayout.subHeaderBgColor,
                                                borderBottomWidth: 1,
                                                opacity: 0.5,
                                                width: SCREEN_WIDTH - 50,
                                                alignSelf: 'center',
                                                marginVertical: 5
                                            }}
                                        >
                                        </View>

                                        <View
                                            style={{
                                                marginTop:2
                                            }}
                                        >

                                            {/* <View>

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_14,
                                                        fontWeight: '600',
                                                        color: colorLayout.subTextColor
                                                    }}
                                                >
                                                    Amount
                                                </Text>

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_16,
                                                        marginTop: 2,
                                                        color: colorLayout.subTextColor,
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    {this.state.currencySymbol} {(a['amount'] as any).toFixed(2)}
                                                </Text>

                                            </View> */}

                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                marginTop: 10
                                            }}
                                        >

                                            <View
                                                style={{
                                                    flex: 1
                                                }}
                                            >

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_12,
                                                        fontWeight: '400',
                                                        color: colorLayout.subTextColor
                                                    }}
                                                >
                                                    Amount
                                                </Text>

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_14,
                                                        marginTop: 2,
                                                        fontWeight: '600',
                                                        color: colorLayout.subTextColor
                                                    }}
                                                >
                                                    {this.state.currencySymbol} {(a['amount'] as any).toFixed(2)}
                                                </Text>

                                            </View>

                                            <View
                                                style={{
                                                    flex: 1
                                                }}
                                            >

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_12,
                                                        fontWeight: '400',
                                                        color: colorLayout.subTextColor
                                                    }}
                                                >
                                                    Expense Date
                                                </Text>

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_14,
                                                        marginTop: 2,
                                                        fontWeight: '600',
                                                        color: colorLayout.subTextColor
                                                    }}
                                                >
                                                    {a['expenseDateCustom']}
                                                </Text>

                                            </View>


                                        </View>

                                            <View
                                                style={{
                                                    marginTop: 10
                                                }}
                                            >

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_12,
                                                        fontWeight: '400',
                                                        color: colorLayout.subTextColor
                                                    }}
                                                >
                                                    Site
                                                </Text>

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_14,
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

                                            <View
                                                style={{
                                                    flex: 1
                                                }}
                                            >

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_12,
                                                        fontWeight: '400',
                                                        color: colorLayout.subTextColor
                                                    }}
                                                >
                                                    Contact Name
                                                </Text>

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_14,
                                                        marginTop: 2,
                                                        fontWeight: '600',
                                                        color: colorLayout.subTextColor
                                                    }}
                                                >
                                                    {a['contactName']}
                                                </Text>

                                            </View>

                                            <View
                                                style={{
                                                    flex: 1
                                                }}
                                            >

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_12,
                                                        fontWeight: '400',
                                                        color: colorLayout.subTextColor
                                                    }}
                                                >
                                                    Contact Number
                                                </Text>

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_14,
                                                        marginTop: 2,
                                                        fontWeight: '600',
                                                        color: colorLayout.subTextColor
                                                    }}
                                                >
                                                    {a['contactNo']}
                                                </Text>

                                            </View>

                                        </View>

                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                marginTop: 10
                                            }}
                                        >

                                            <View
                                                style={{
                                                    flex: 1
                                                }}
                                            >

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_12,
                                                        fontWeight: '400',
                                                        color: colorLayout.subTextColor
                                                    }}
                                                >
                                                    Category
                                                </Text>

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_14,
                                                        marginTop: 2,
                                                        fontWeight: '600',
                                                        color: colorLayout.subTextColor
                                                    }}
                                                >
                                                    {a['qCategoryName'] ? a['qCategoryName'] : '--'}
                                                </Text>

                                            </View>

                                            <View
                                                style={{
                                                    flex: 1
                                                }}
                                            >

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_12,
                                                        fontWeight: '400',
                                                        color: colorLayout.subTextColor
                                                    }}
                                                >
                                                    Created On
                                                </Text>

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_14,
                                                        marginTop: 2,
                                                        fontWeight: '600',
                                                        color: colorLayout.subTextColor
                                                    }}
                                                >
                                                    {a['createdOnCustom']}
                                                </Text>

                                            </View>


                                        </View>

                                            <View
                                                style={{
                                                    marginTop: 10
                                                }}
                                            >

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_12,
                                                        fontWeight: '400',
                                                        color: colorLayout.subTextColor
                                                    }}
                                                >
                                                    Comment
                                                </Text>

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_14,
                                                        color: colorLayout.subTextColor,
                                                        marginTop: 2,
                                                        fontWeight: '600',
                                                    }}
                                                >
                                                    {a['comment'] ? a['comment'] : '--'}
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

            <AlertComponent 
                message={this.state.modalMessage} 
                visible={this.state.openModal}
                animation={'fade'}
                onCancel={() => {
                this.setState({
                    openModal: false
                });
                }}
                onOk={() => {
                    this.setState({ 
                        openModal: false
                    }, () => {
                        if(this.state.actionType == 'update'){
                            Linking.openURL(this.state.mAppUrl);
                        }
                    });
                }}
                headerTitle={this.state.messageModalHeaderTitle}
                okText={this.state.okText}
                cancelText={this.state.cancelText}
                showCancel={this.state.showCancelBtn}
            />

            </Wrapper>
        );
    }
}

const styles = StyleSheet.create({
    modalView: {
        backgroundColor: '#ffffff',
        borderRadius: CARD_BORDER_RADIUS,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 4,
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

const mapStateToProps = ({auth}) => {
    return ({
        userData: auth.userData,
        colorLayout: auth.colorLayout, 
        allSites: auth.allSites
    });
};

const ActionCreators = Object.assign(
    { userData },
    { colorLayout },
    { allSites }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(VoucherList);
