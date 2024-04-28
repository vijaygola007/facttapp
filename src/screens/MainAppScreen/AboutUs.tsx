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


class AboutUs extends PureComponent {

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
        mail: ''
    };

    componentDidMount() {
        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
        getRegistrationData().then((data: any) => {
            this.setState({
                mail: data.supportEmail
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
                    FACTT an audit compliance tool designed to perform Quality Audits, Compliance Audits, Assets Audits, Branding Guidelines, Hygen Audits with Expense tracking of each sites or retails shops.
                    The application can be used in a variety of industries, including retail, banking, and site audits etc.
                </Text>

                <Text
                    style={{
                        fontWeight: '400',
                        color: colorLayout.subTextColor,
                    }}               
                >
                    The application typically provides a range of features and functionalities, such as data
        online and offline data collection, Video , Image , Audio Evidence Upload, Geo-Tagging, Email Notification, Audit Compliance. Expense Tracking,
        Audit Reminder Notification,Incident Creation and Complete Journey, Esclation Matrix. Audit Scoring, Vendor performance and much more.
                </Text>

                <Text
                    style={{
                        fontWeight: '400',
                        color: colorLayout.subTextColor,
                    }}               
                >
                    These features enable auditors to collect, analyze, and report on audit data in a more efficient and effective manner.
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

export default connect(mapStateToProps, mapDispatchToProps)(AboutUs);
