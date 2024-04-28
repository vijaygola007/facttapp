import React, { PureComponent, useRef } from 'react';
import { 
    StyleSheet,
    View,
    Text,
    LogBox
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import crashlytics from '@react-native-firebase/crashlytics';

import { userData } from '../../store/actions';

import { getLocalUserData, getRegistrationData } from '../../utilities/helperFunctions';

class HelpDesk extends PureComponent {

    constructor(props) {
        super(props);
    }

    state = {
        registration_code: '',
        showMessage: false,
        visible: false,
        message: '',
        currentPosition: 0,
        index: 0,
        mail: '',
        supportNo: ''
    };

    componentDidMount() {
        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
        getRegistrationData().then((data: any) => {
            this.setState({
                mail: data.supportEmail,
                supportNo: data.supportNo
            })
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

    onPageChange(){
        this.setState({currentPosition: (this.state.currentPosition + 1)});
    }

    render() {
        const { colorLayout, userData } = this.props as any;
        return (
            <View
                style={styles.container}
            >

                <Text
                    style={{
                        fontWeight: '400',
                        color: colorLayout.subTextColor,
                        fontSize: 14
                    }}               
                >
                    FACTT - Customer Support.
                </Text>

                <Text
                    style={{
                        fontWeight: '400',
                        color: colorLayout.subTextColor,
                    }}               
                >
                    We are glad to give our customers great support.
                </Text>

                <Text
                    style={{
                        fontWeight: '400',
                        color: colorLayout.subTextColor,
                    }}               
                >
                    You can communicate with our support team for any query.
                </Text>

                <Text
                    style={{
                        fontWeight: '400',
                        color: colorLayout.subTextColor,
                        display: this.state.mail ? 'flex' : 'none'
                    }}               
                >
                    Email us : <Text style={{fontWeight: '900'}}>{this.state.mail ? this.state.mail : ''}</Text>
                </Text>

                <Text
                    style={{
                        fontWeight: '400',
                        color: colorLayout.subTextColor,
                        display: this.state.supportNo ? 'flex' : 'none'
                    }}               
                >
                    Email us : <Text style={{fontWeight: '900'}}>{this.state.supportNo ? this.state.supportNo : ''}</Text>
                </Text>


            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        flex: 1,
        padding: 15
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

export default connect(mapStateToProps, mapDispatchToProps)(HelpDesk);
