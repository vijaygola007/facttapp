import React, { PureComponent } from 'react';
import { 
    StyleSheet,
    View,
    Text,
    Dimensions,
    TouchableOpacity,
    Image,
    ImageBackground,
    StatusBar
} from 'react-native';
import { Icon } from 'react-native-elements';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import Swiper from 'react-native-swiper';

import { setWelcomeScreenData } from '../../utilities/helperFunctions';
import { userData, colorLayout } from '../../store/actions';
import { hexToRgbA } from '../../utilities/constants';

let screenWidth = Dimensions.get('window').width;
let screenHeight = Dimensions.get('screen').height - (StatusBar.currentHeight as any);

class Audit extends PureComponent {

    _unsubscribe: any;
    swiper: any;
    _focus_unsubscribe:any;
    state = {
        userData: {},
        visible: false,
        orientationChanged: false,
        height: screenHeight,
        currentIndex: 0
    };

    componentDidMount() {
        
        this._focus_unsubscribe = this.props['navigation'].addListener('focus', () => {
            this.props['navigation'].addListener('blur', () => {
                if(this._focus_unsubscribe){
                    this._focus_unsubscribe();
                }
                if(this._unsubscribe){
                    this._unsubscribe();
                }
                // this._netunsubscribe();
            });
            this.callInitials();
        });
        this.props['navigation'].addListener('blur', () => {
            if(this._focus_unsubscribe){
                this._focus_unsubscribe();
            }
            if(this._unsubscribe){
                this._unsubscribe();
            }
            // this._netunsubscribe();
        });

    }

    callInitials(){
        setWelcomeScreenData({
            isWelcomeScreenCalled: true 
        });
        
        this._unsubscribe = this.props['navigation'].addListener('beforeRemove', (e: any) => {
            if(e.data.action.type == 'GO_BACK'){
                e.preventDefault();
            }
            return;
        });
    }

    componentWillUnmount(){
        
    }
    
    render() {
        const { colorLayout } = this.props as any;

        return (
           
            <Swiper 
                style={styles.wrapper} 
                showsButtons={false}
                dotStyle={
                    {
                        // top: Platform.OS == 'ios' ? 5 : 15,
                        backgroundColor: hexToRgbA(colorLayout.subTextColor, '0.4'),
                        width: 10,
                        height: 10,
                        borderRadius: 10
                    }
                }
                activeDotStyle={
                    {
                        // top: Platform.OS == 'ios' ? 5 : 15,
                        width: 10,
                        height: 10,
                        backgroundColor: colorLayout.subHeaderBgColor,
                        borderRadius: 10
                    }
                }
                removeClippedSubviews={false}
                loop={false}
                onIndexChanged={(index) => {
                    this.setState({
                        currentIndex: index
                    })
                }}
                index={this.state.currentIndex}
                ref={component => this.swiper = component}
                onLayout={(evt) => {
                    this.setState({
                        height: evt.nativeEvent.layout.height
                    })
                }}
            >
                
                <View
                    style={{
                        flex: 1,
                        marginRight: 2
                    }}
                >
                    <ImageBackground
                        source={require('../../../assets/images/background.png')}
                        style={{
                            width: screenWidth,
                            height: screenHeight,
                            position: 'absolute'
                        }}
                    />
                    <View
                        style={{
                            alignSelf: 'center',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            // height: height * 0.7,
                            flex: 0.7,
                        }}
                    >
                        <Image
                            style={{ ...styles.cat_imag}}
                            source={require('../../../assets/img/audit.png')} 
                        />
                    </View>

                    <View
                        style={{
                            borderTopWidth: 1,
                            borderLeftWidth: 1,
                            borderRightWidth: 1,
                            borderTopLeftRadius: 30,
                            borderTopRightRadius: 30,
                            backgroundColor: colorLayout.cardBgColor,
                            borderTopColor: hexToRgbA(colorLayout.subTextColor, '0.2'),
                            borderLeftColor: hexToRgbA(colorLayout.subTextColor, '0.2'),
                            borderRightColor: hexToRgbA(colorLayout.subTextColor, '0.2'),
                            flexDirection: 'column',
                            paddingBottom: 20,
                            // height: height * 0.3,
                            justifyContent: 'center',
                            flex: 0.3
                        }}
                    >

                        <View
                            style={{
                                paddingHorizontal: 10,
                                flex: 1,
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}
                        >
                        <Text
                            style={{
                                textAlign: 'center',
                                fontSize: 24,
                                color: colorLayout.subTextColor,
                                flex: 0.45,
                            }}
                        >
                            AUDIT
                        </Text>

                            <Text
                                style={{
                                    textAlign: 'center',
                                    fontSize: 16,
                                    color: colorLayout.subTextColor,
                                    lineHeight: 18
                                }}
                            >
                            Conduct quick audits at your convenience with easy navigation digital evidence viz. video, audio and image proof.
                            </Text>

                            <Text
                                style={{
                                    textAlign: 'center',
                                    fontSize: 16,
                                    color: colorLayout.subTextColor,
                                }}
                            >
                            
                            </Text>
                        </View>

                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingHorizontal: 15,
                            }}
                        >

                            <TouchableOpacity
                                onPress={() => {
                                    this.props['navigation'].navigate('AuthStackNavigator', {
                                        screen: 'Registration'
                                    })
                                }}
                            >
                                <Text
                                    style={{
                                        color: colorLayout.headerBgColor,
                                        fontSize: 16,
                                        width: 80
                                    }}
                                >
                                    Skip
                                </Text>
                            </TouchableOpacity>

                            

                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'flex-end',
                                    alignItems: 'center'
                                }}
                                onPress={() => {
                                    this.swiper.scrollBy(1);
                                }}
                            >
                                <Text
                                    style={{
                                        color: colorLayout.headerBgColor,
                                        // marginTop: 7,
                                        marginRight:5,
                                        fontSize: 16,
                                        width: 80,
                                        textAlign: 'right'
                                    }}
                                >
                                    Next
                                </Text>
                                <Icon
                                    name='angle-right'
                                    type='font-awesome'
                                    color={colorLayout.headerBgColor}
                                    containerStyle={{
                                        // paddingRight: 10,
                                        // marginTop: 2
                                    }}
                                    iconStyle={{
                                        fontSize: 26
                                    }}
                                    
                                />
                            </TouchableOpacity>

                        </View>

                    </View>
                </View>

                <View
                    style={{
                        flex: 1,
                        marginHorizontal: 2
                    }}
                >
                    <ImageBackground
                        source={require('../../../assets/images/background.png')}
                        style={{
                            width: screenWidth,
                            height: screenHeight,
                            position: 'absolute'
                        }}
                    />
                    <View
                        style={{
                            alignSelf: 'center',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            // height: height * 0.7,
                            flex: 0.7
                        }}
                    >
                        <Image
                            style={{ ...styles.cat_imag}}
                            source={require('../../../assets/img/analyse.png')} 
                        />
                    </View>
                    <View
                        style={{
                            borderTopWidth: 1,
                            borderLeftWidth: 1,
                            borderRightWidth: 1,
                            borderTopLeftRadius: 30,
                            borderTopRightRadius: 30,
                            backgroundColor: colorLayout.cardBgColor,
                            borderTopColor: hexToRgbA(colorLayout.subTextColor, '0.2'),
                            borderLeftColor: hexToRgbA(colorLayout.subTextColor, '0.2'),
                            borderRightColor: hexToRgbA(colorLayout.subTextColor, '0.2'),
                            flexDirection: 'column',
                            paddingBottom: 20,
                            // height: height * 0.3,
                            justifyContent: 'center',
                            flex: 0.3
                        }}
                    >
                    
                    <View
                        style={{
                            flex: 1,
                            paddingHorizontal: 10,
                            justifyContent: 'center',
                            flexDirection: 'column'
                        }}
                    >
                        <Text
                            style={{
                                textAlign: 'center',
                                fontSize: 24,
                                color: colorLayout.subTextColor,
                                flex: 0.45
                            }}
                        >
                            ANALYSE
                        </Text>

                        <Text
                            style={{
                                textAlign: 'center',
                                fontSize: 16,
                                color: colorLayout.subTextColor,
                                lineHeight: 18
                            }}
                        >
                            Simple yet so powerful BI with flexibility to build your own reports and in-depth insight for audit purposes.
                        </Text>
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            // marginBottom: Platform.OS == 'ios' && DeviceInfo.hasNotch() ? -10 : -15,
                            alignItems: 'center',
                            paddingHorizontal: 15,
                            // height: 40
                        }}
                    >

                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                onPress={() => {
                                    this.swiper.scrollBy(-1);
                                }}
                            >
                                <Icon
                                    name='angle-left'
                                    type='font-awesome'
                                    color={colorLayout.headerBgColor}
                                    containerStyle={{
                                        // paddingLeft: 10,
                                        // marginTop: 11
                                    }}
                                    iconStyle={{
                                        fontSize: 26
                                    }}
                                    
                                />
                                <Text
                                    style={{
                                        color: colorLayout.headerBgColor,
                                        // marginTop: 18,
                                        marginLeft: 5,
                                        fontSize: 16,
                                        width: 80,
                                        textAlign: 'left'
                                    }}
                                >
                                    Back
                                </Text>
                            </TouchableOpacity>


                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                            onPress={() => {
                                this.swiper.scrollBy(1);
                            }}
                        >
                            <Text
                                style={{
                                    color: colorLayout.headerBgColor,
                                    // marginTop: 18,
                                    marginRight: 5,
                                    fontSize: 16,
                                    width: 80,
                                    textAlign: 'right'
                                }}
                            >
                                Next
                            </Text>
                            <Icon
                                name='angle-right'
                                type='font-awesome'
                                color={colorLayout.headerBgColor}
                                containerStyle={{
                                    // paddingRight: 10,
                                    // marginTop: 13
                                }}
                                iconStyle={{
                                    fontSize: 26
                                }}
                                
                            />
                        </TouchableOpacity>

                    </View>
                    
                </View>
                </View>

                <View
                    style={{
                        flex: 1,
                        marginLeft: 3
                    }}
                >
                    <ImageBackground
                        source={require('../../../assets/images/background.png')}
                        style={{
                            width: screenWidth,
                            height: screenHeight,
                            position: 'absolute'
                        }}
                    />
                    <View
                        style={{
                            alignSelf: 'center',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            // height: height * 0.7,
                            flex: 0.7
                        }}
                    >
                        <Image
                            style={{ ...styles.cat_imag}}
                            source={require('../../../assets/img/comply.png')} 
                        />
                    </View>
                    <View
                    style={{
                        borderTopWidth: 1,
                        borderLeftWidth: 1,
                        borderRightWidth: 1,
                        borderTopLeftRadius: 30,
                        borderTopRightRadius: 30,
                        backgroundColor: colorLayout.cardBgColor,
                        borderTopColor: hexToRgbA(colorLayout.subTextColor, '0.2'),
                        borderLeftColor: hexToRgbA(colorLayout.subTextColor, '0.2'),
                        borderRightColor: hexToRgbA(colorLayout.subTextColor, '0.2'),
                        flexDirection: 'column',
                        paddingBottom: 20,
                        // height: height * 0.3,
                        justifyContent: 'center',
                        flex: 0.3
                    }}
                >
                
                <View
                    style={{
                        flex: 1,
                        paddingHorizontal: 10,
                        justifyContent: 'center',
                        flexDirection: 'column'
                    }}
                >
                    <Text
                        style={{
                            textAlign: 'center',
                            fontSize: 24,
                            color: colorLayout.subTextColor,
                            flex: 0.45
                        }}
                    >
                        COMPLY
                    </Text>

                    <Text
                        style={{
                            textAlign: 'center',
                            fontSize: 16,
                            color: colorLayout.subTextColor,
                        }}
                    >
                        Ensure highest security standards on cyber security checks for sorting captured data with 256 Bit encryption and OWASP compliance.
                    </Text>
                </View>

                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        // marginBottom: Platform.OS == 'ios' && DeviceInfo.hasNotch() ? -10 : -12,
                        alignItems: 'center',
                        paddingHorizontal: 15,
                        // height: 40
                    }}
                >

                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                            onPress={() => {
                                this.swiper.scrollBy(-1);
                            }}
                        >
                            <Icon
                                name='angle-left'
                                type='font-awesome'
                                color={colorLayout.headerBgColor}
                                containerStyle={{
                                    // paddingLeft: 10,
                                    // marginTop: 16
                                }}
                                iconStyle={{
                                    fontSize: 26
                                }}
                                
                            />
                            <Text
                                style={{
                                    color: colorLayout.headerBgColor,
                                    // marginTop: 22,
                                    marginLeft: 5,
                                    fontSize: 16,
                                    width: 80,
                                    textAlign: 'left'
                                }}
                            >
                                Back
                            </Text>
                        </TouchableOpacity>


                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onPress={() => {
                            this.props['navigation'].navigate('AuthStackNavigator', {
                                screen: 'Registration'
                            })
                        }}
                    >
                        <Text
                            style={{
                                color: colorLayout.headerBgColor,
                                // marginRight: 10,
                                fontSize: 16,
                                width: 80,
                                textAlign: 'right'
                            }}
                        >
                            Done
                        </Text>
                        
                    </TouchableOpacity>

                </View>
                
            </View>
                </View>

            </Swiper>
               
                
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    cat_imag: {
        width: 90,
        height: 90,
    },
    wrapper: {
        // flex: 1,
        backgroundColor: 'transparent'
    }
});


const mapStateToProps = ({auth}) => {
    return ({
        userData: auth.userData,
        colorLayout: auth.colorLayout
    });
};

const ActionCreators = Object.assign(
    {},
    { userData },
    { colorLayout }
);

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Audit);
