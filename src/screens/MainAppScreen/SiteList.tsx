import React, { PureComponent } from 'react';
import { 
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    LogBox,
    Platform, 
    Linking
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'react-native-elements';
import { TextInput, Snackbar } from 'react-native-paper';
import Spinner from 'react-native-loading-spinner-overlay';
import crashlytics from '@react-native-firebase/crashlytics';
import NetInfo from "@react-native-community/netinfo";
import {showLocation} from 'react-native-map-link';
import Geolocation from 'react-native-geolocation-service';

import { userData, colorLayout, allSites, setSelectedSite } from '../../store/actions';
import { getLocalUserData } from '../../utilities/helperFunctions';

// database
import * as storage from '../../db';

import { hexToRgbA, InfiniteScroll, colors } from '../../utilities/constants';

import { CodeScanComponent, Message } from '../../components/common';

// wrappers
import { Wrapper, PADDING_10, APP_PADDING, BORDER_RADIUS, CARD_BORDER_RADIUS,
    TEXT_SIZE_12, TEXT_SIZE_14, TEXT_SIZE_16, TEXT_SIZE_18, TEXT_SIZE_26, SCREEN_WIDTH, BODY_BOX_HEIGHT,
    TEXT_SIZE_10
} from '../../layout/wrapper';


class SiteList extends PureComponent {

    inputRef :any;
    _b: any;
    subscribeKeyboardShow: any;
    subscribeKeyboardHide: any;
    _focus_unsubscribe: any;

    constructor(props) {
        super(props);
    }

    state = {
        registration_code: '',
        showMessage: false,
        message: '',
        site: this.props['route']['params']['props'],
        site_data: [],
        site_all_data: [],
        site_all_data_copy: [],
        search_text: '',
        spinner: true,
        limit: 10,
        offset: 0,
        showActivityLoader: true,
        openDropdown: false,
        scanVisible: false,
        headerTitle: '',
        bottomMargin: 0,
        snackType: '',
        showSnack: false,
        fetchingFromServer: false
    };

    componentDidMount() {
        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
        this.fetchAllData();
        this.props['navigation'].addListener('focus', (e: any) => {
            this.fetchAllData();
        });
        
    }

    componentWillUnmount(){
        if(this._focus_unsubscribe){
            this._focus_unsubscribe();
        }
    }

    async onCrash(error_log: any) {
        crashlytics().log('Sitelist screen crash analytics');
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
                screen: 'Site List',
                error: error.message,
                user: user ? JSON.stringify(user) : ''
            });
            crashlytics().crash();
        })
    }

    fetchAllData(){
        var sql = `select * from ${storage.site_tbl} where sTypeId = ${this.state.site['sTypeID']} order by siteName asc`;
        storage.runQuery(sql)
        .then((res: any) => {

            res.forEach((s: any) => {
                s['is_visible'] = true;
                s['assets'] = JSON.parse(s['assets']);
            });

            this.props['actions'].allSites(res);

            this.setState({
                site_all_data: res,
                site_all_data_copy: res,
                site_data: res.slice(0, 10),
                offset: 0,
                spinner: false
            }, () => {
                
            });
            // this.props['navigation'].setParams({totalAllSites: res ? res.length : 0});

        }).catch((err) => {
            // this.props['actions'].allSites([]);
            // this.props['navigation'].setParams({totalAllSites: 0});
        })
    }

    fetchChunkedData(){
        var sites_clone = JSON.parse(JSON.stringify(this.state.site_data));
        var res = JSON.parse(JSON.stringify(this.state.site_all_data_copy)).slice(this.state.offset, this.state.offset + 10);
        res.forEach((s: any) => {
            sites_clone.push(s);
        });
        this.setState({
            site_data: sites_clone
        });
    }

    search_sites(value: string){
        this.setState({
            search_text: value
        }, () => {
            
            var filter = JSON.parse(JSON.stringify(this.state.site_all_data));
            filter.forEach((s: object) => {
                if(s['siteName'].toLowerCase().includes(value.toLowerCase().trim()) || s['siteCode'].toLowerCase().includes(value.toLowerCase().trim())){
                    s['is_visible'] = true;
                }else{
                    s['is_visible'] = false;
                }
            });
            this.setState({
                site_all_data_copy: filter.filter((f: any) => f.is_visible),
                site_data: filter.filter((f: any) => f.is_visible).slice(0, 10),
                offset: 0
            });
        });
        
    }

    async goToInspectionList(inspection: any){
        this.props['actions'].setSelectedSite({data: inspection});
        // var sql = `select * from ${storage.mobile_data_tbl} where stypeId = ${inspection['sTypeId']}`;
        // storage.runQuery(sql).then((res: any) => {
            this.props['navigation'].navigate('InspectionsList', {
                props: inspection
            })
        // });
    }

    accessLocation = async() => new Promise((resolve, reject) => {
        
        Geolocation.getCurrentPosition(info => {
            resolve(info.coords);
        }, (err) => {
           reject(err);
        },{
            enableHighAccuracy: true, 
            timeout: 2000000, 
            maximumAge: 100000
        });
    });

    async openMap(site: any){
        if(site.siteLat == null && site.siteLog == null){
            this.setState({
                snackType: 'error',
                showSnack: true,
                message: 'Map cann\'t be opened'
            });
            return;
        }
        if(site.siteLat == undefined && site.siteLog == undefined){
            this.setState({
                snackType: 'error',
                showSnack: true,
                message: 'Map cann\'t be opened'
            });
            return;
        }
        if(site.siteLat.length == 0 && site.siteLog.length == 0){
            this.setState({
                snackType: 'error',
                showSnack: true,
                message: 'Map cann\'t be opened'
            });
            return;
        }

        this.accessLocation().then((coords: any) => {
        
            showLocation({
                latitude: site.siteLat,
                longitude: site.siteLog,
                sourceLatitude: coords.latitude,
                sourceLongitude: coords.longitude,
                // title: site.siteAddress,
            });

        }).catch((err) => {
            this.setState({
                snackType: 'error',
                showSnack: true,
                message: 'Location permission is required to open map'
            });
            return;
        })
        
    }

    fetchFromServer(){
        this.setState({
            fetchingFromServer: true
        });

        setTimeout(() => {
            this.setState({
                fetchingFromServer: false,
                snackType: 'error',
                showSnack: true,
                message: 'No matching found'
            });
        }, 1000)
    }

    render() {
        const { colorLayout, navigation, userData } = this.props as any;
        const { scanVisible } = this.state;
        
        return (
            <Wrapper
      
                style={{
                    padding: 0
                }} 
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
                    }}
                >
                    <View
                        style={{
                            zIndex: 1,
                            marginTop: 0,
                            width: SCREEN_WIDTH - (2*APP_PADDING),
                            flexDirection: 'row',
                            justifyContent: 'space-between'
                            
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
                                marginTop: -6,
                                backgroundColor: '#fff',
                                width: SCREEN_WIDTH - 65,
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
                            onChangeText={text => this.search_sites(text)}
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

                        <TouchableOpacity
                            style={{
                                flexDirection: 'row'
                            }}
                            onPress={() => {
                                this.setState({
                                    scanVisible: true
                                })
                            }}
                            activeOpacity={0.8}
                        >
                            <Image
                                style={{
                                    height: 38,
                                    width: 35
                                }}
                                source={require('../../../assets/icons/code-scan.jpeg')} 
                            />
                        </TouchableOpacity>

                    </View>
                </View>

                

                {
                    this.state.site_all_data_copy.length == 0 && !this.state.spinner && !this.state.search_text &&
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
                            No sites
                        </Text>
                    </View>
                }
                {
                    this.state.site_all_data_copy.length == 0 && !this.state.spinner && this.state.search_text &&
                    <View
                        style={{
                            flexDirection: 'column',
                            justifyContent: 'center',
                            flex: 1,
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

                        <View
                            style={{
                                paddingVertical: 16,
                                backgroundColor: '#fff'
                            }}
                        >
                            <View
                                style={{
                                    backgroundColor: '#fff',
                                    shadowColor: '#000',
                                    shadowOpacity: 1,
                                    shadowRadius: 10,
                                    elevation: 10,
                                    marginHorizontal: APP_PADDING,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                            
                                <TouchableOpacity
                                    onPress={async () => {
                                        var net = await NetInfo.fetch();
                                        if(net.isConnected && net.isInternetReachable){
                                            this.fetchFromServer();
                                        }else{
                                            this.setState({
                                                showMessage: true,
                                                message: 'Internet connection is not available',
                                                headerTitle: 'Alert',
                                            });
                                        }
                                    }}
                                    activeOpacity={1}
                                    style={{
                                        backgroundColor: colorLayout['subHeaderBgColor'],
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        paddingVertical: PADDING_10,

                                        flexDirection: 'row',
                                        shadowColor: '#000',
                                        shadowOpacity: 1,
                                        shadowRadius: 10,
                                        elevation: 10,
                                        width: '100%',
                                        opacity: this.state.fetchingFromServer ? 0.6 : 1
                                    }}
                                    disabled={this.state.fetchingFromServer}
                                >
                                    <Text
                                        style={{
                                            color: colorLayout['headerTextColor']
                                        }}
                                    >
                                        Search in server
                                    </Text>
                                </TouchableOpacity>
                                <ActivityIndicator 
                                    style={{
                                        opacity: 1,
                                        position: 'absolute',
                                        zIndex: 10,
                                        display: this.state.fetchingFromServer ? 'flex' : 'none'
                                    }}
                                    size={36}
                                    color={colorLayout['headerTextColor']}
                                />

                                
                            </View>
                        </View>
                    </View>
                }
                {
                    this.state.site_all_data_copy.length == 0 && this.state.spinner &&
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
                    this.state.site_all_data_copy.length > 0 &&
                    <ScrollView
                        style={{
                            backgroundColor: colorLayout.appBgColor,
                        }}
                        onScroll={(event) => {

                            if(InfiniteScroll(event)){
                                if(this.state.offset > this.state.site_all_data_copy.length){
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
                        scrollEnabled={true}
                    >


                    {
                        this.state.site_data.map((a, index) => {
                            return (
                                <View
                                    key={index}
                                    style={{
                                        
                                        display: a['is_visible'] ? 'flex' : 'none',
                                        marginTop: index == 0 ? 10 : 0,
                                        marginBottom: (index == this.state.site_all_data_copy.length - 1) ? 100 : 10,
                                        marginHorizontal: APP_PADDING
                                    }}
                                >
                                    <View
                                        style={{
                                            borderRadius: CARD_BORDER_RADIUS,
                                            shadowColor: '#000',
                                            shadowOffset: {
                                                width: 0,
                                                height: 2
                                            },
                                            shadowOpacity: 0.4,
                                            shadowRadius: 3,
                                            elevation: 4,
                                        }}
                                    >
                                        
                                        <View
                                            style={{
                                                ...styles.modalView, 
                                                backgroundColor: colorLayout['cardBgColor'],
                                                paddingVertical: PADDING_10,
                                                paddingHorizontal: PADDING_10,
                                                // marginHorizontal: PADDING_10,
                                                // marginBottom: (index == this.state.site_all_data_copy.length - 1) ? 100 : 10,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'space-between',
                                                    flex: 1
                                                }}
                                            >

                                                <View
                                                    style={{
                                                        flexDirection: 'column',
                                                        flex: 0.85
                                                    }}
                                                >

                                                    <Text
                                                        style={{
                                                            fontSize: TEXT_SIZE_14,
                                                            color: colorLayout.appTextColor,
                                                            fontWeight: '500'
                                                        }}
                                                    >
                                                        ({a ? a['siteCode'] : ''})
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontSize: TEXT_SIZE_16,
                                                            color: colorLayout.appTextColor,
                                                            fontWeight: '500'
                                                        }}
                                                    >
                                                        {a ? a['siteName'] : ''}
                                                    </Text>

                                                </View>

                                                <View
                                                    style={{
                                                        flexDirection: 'row'
                                                    }}
                                                >

                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            this.openMap(a);
                                                        }}
                                                        activeOpacity={0.8}
                                                        style={{
                                                            flexDirection: 'row',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            marginRight: 6
                                                        }}
                                                    >
                                                        <Icon
                                                            name='map-pin'
                                                            type='feather'
                                                            color={colorLayout.subHeaderBgColor}
                                                            containerStyle={{
                                                                
                                                            }}
                                                            iconStyle={{
                                                                fontSize: TEXT_SIZE_26,
                                                            }}
                                                            
                                                        />
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            this.props['navigation'].navigate('AddVoucher', {
                                                                props: a
                                                            })
                                                        }}
                                                        activeOpacity={0.8}
                                                        style={{
                                                            flexDirection: 'row',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            marginRight: 6,
                                                            display: userData['userRole'].toLowerCase().trim() == 'channel manager' ? 'flex' : 'none'
                                                        }}
                                                    >
                                                        <Icon
                                                            name='ticket-alt'
                                                            type='fontisto'
                                                            color={colorLayout.subHeaderBgColor}
                                                            containerStyle={{
                                                                
                                                            }}
                                                            iconStyle={{
                                                                fontSize: TEXT_SIZE_26,
                                                            }}
                                                            
                                                        />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            this.props['navigation'].navigate('InspectionHistory', {
                                                                props: a
                                                            })
                                                        }}
                                                        activeOpacity={0.8}
                                                        style={{
                                                            flexDirection: 'row',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <Icon
                                                            name='back-in-time'
                                                            type='entypo'
                                                            color={colorLayout.subHeaderBgColor}
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
                                                    width: SCREEN_WIDTH*0.9,
                                                    alignSelf: 'center',
                                                    marginTop: 5,
                                                    marginBottom: 10
                                                }}
                                            >
                                            </View>

                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start'
                                                }}
                                            >

                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_12,
                                                        color: colorLayout.subTextColor,
                                                        flex: 1,
                                                        paddingRight: PADDING_10,
                                                        marginTop: -5,
                                                    }}
                                                >
                                                    {a ? a['siteAddress'] : ''}
                                                </Text>

                                                <TouchableOpacity
                                                    style={{
                                                        flexDirection: 'row',
                                                        backgroundColor: colorLayout.subHeaderBgColor,
                                                        width: 95,
                                                        height: 40,
                                                        borderRadius: BORDER_RADIUS,
                                                        justifyContent: 'center',
                                                        alignItems: 'center'
                                                    }}
                                                    onPress={() => {
                                                        this.goToInspectionList(a);
                                                    }}
                                                    activeOpacity={0.8}
                                                >

                                                    <View
                                                        style={{
                                                            width: 45,
                                                        }}
                                                    >
                                                        
                                                        <Text
                                                            style={{
                                                                color: colorLayout.headerTextColor,
                                                                textAlign: 'center',
                                                                fontWeight: '800',
                                                                fontSize: TEXT_SIZE_12,
                                                                textTransform: 'uppercase',
                                                                textAlignVertical: 'center'
                                                            }}
                                                        >
                                                            Start
                                                        </Text>
                                                    </View>

                                                </TouchableOpacity>

                                            </View>

                                            <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_12,
                                                        color: colorLayout.subTextColor,
                                                        flex: 1,
                                                        paddingRight: PADDING_10,
                                                    }}
                                                >
                                                    {a ? a['lastAuditedOn'] ? 'Last Audit Date - '+a['lastAuditedOn'] : '' : ''}
                                                </Text>

                                        </View>
                                    </View>

                                    {
                                        index == this.state.site_data.length - 1 &&
                                        this.state.site_data.length !== this.state.site_all_data_copy.length &&

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

                {
                    scanVisible &&

                    <CodeScanComponent
                        visible={scanVisible}
                        onClose={() => {
                            this.setState({
                                scanVisible: false
                            })
                        }}
                        onSubmit={(site_detail: any) => {
                            this.setState({
                                scanVisible: false
                            })
                            if(site_detail){
                                var sql = `select * from ${storage.site_tbl} where siteCode = '${site_detail}'`;
                                storage.runQuery(sql)
                                .then((res: any) => {
                                if(res.length > 0){
                                    res.forEach((s: any) => {
                                    s['assets'] = JSON.parse(s['assets']);
                                    });
                                        navigation.navigate('InspectionsList', {
                                        props: res[0]
                                    })
                                }else{
                                    
                                    this.setState({
                                        headerTitle: 'Alert',
                                        message: 'This site is not available',
                                        showMessage: true
                                    })
                                }
                                });
                            }
                        }}
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
                        });
                    }}
                    position={'bottom'}
                    headerTitle={this.state.headerTitle}
                    colorLayout={colorLayout}
                    animation={'fade'}
                ></Message>

                <Snackbar
                    visible={this.state.showSnack}
                    onDismiss={() => {
                        this.setState({
                            showSnack: false
                        })
                    }}
                    style={{
                        backgroundColor: this.state.snackType == 'error' ? colors.danger : this.state.snackType == 'success' ? colors.success : colorLayout.headerBgColor,
                        color: this.state.snackType == 'error' ? '#fff' : this.state.snackType == 'success' ? '#fff' : colorLayout.headerTextColor
                    }}
                    duration={2000}
                    // action={{
                    //     label: 'Close',
                    //     onPress: () => {
                    //         this.setState({
                    //             showSnack: false
                    //         })
                    //     },
                    // }}
                >
                    {this.state.message}
                </Snackbar>

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
        shadowOpacity: 1,
        shadowRadius: 3,
        elevation: 8,
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
    { allSites },
    { setSelectedSite }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(SiteList);
