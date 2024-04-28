import React, { PureComponent } from 'react';
import { 
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
    LogBox,
    Platform, Image
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'react-native-elements';
import { Snackbar } from 'react-native-paper';
import Spinner from 'react-native-loading-spinner-overlay';
import crashlytics from '@react-native-firebase/crashlytics';
import DateTimePicker from '@react-native-community/datetimepicker';
import DocumentPicker from 'react-native-document-picker';

import { formatCurrency } from "react-native-format-currency";
import {
    TextField,
} from 'rn-material-ui-textfield';
import FileViewer from "react-native-file-viewer";

import { userData, colorLayout, allSites } from '../../store/actions';
import { getLocalUserData } from '../../utilities/helperFunctions';

// database
import * as storage from '../../db';
import RNFS from 'react-native-fs';

import { getService, SendErrorLog, postFormDataService } from '../../api-services';
import { hexToRgbA, MONTH_NAME, urls, NumericPattern, AlphaNumericPattern, encrypt, decrypt } from '../../utilities/constants';

import { DropdownItem, Message, CaptureImageComponent, AddItem, AlertComponent, ShowVoucherList } from '../../components/common';

// wrappers
import { Wrapper, PADDING_10, APP_PADDING, BORDER_RADIUS, CARD_BORDER_RADIUS,
    TEXT_SIZE_10, TEXT_SIZE_12, TEXT_SIZE_14, TEXT_SIZE_16, TEXT_SIZE_18, TEXT_SIZE_26, SCREEN_WIDTH, BODY_BOX_HEIGHT, PADDING_16, PADDING_12,
    PADDING_14,BTN_BORDER_RADIUS, PADDING_6, PADDING_8, VIEW_PART_HEIGHT, HEADER_HEIGHT
} from '../../layout/wrapper';

const color = {
    danger: '#CD3D3E',
    warning: '#EB9D3E',
    success: '#4DAD49',
    info: '#4CB3D5',
    default: '#565656'
};

class AddVoucher extends PureComponent {

    inputRef :any;
    _b: any;
    subscribeKeyboardShow: any;
    subscribeKeyboardHide: any;
    _focus_unsubscribe: any;
    _siteRef: any;

    constructor(props) {
        super(props);
    }

    state = {
        showMessage: false,
        message: '',
        headerTitle: '',
        contactName: '',
        contactNameFocused: false,
        defaultDate: new Date(),
        isDatePickerVisible: false,
        isTimePickerVisible: false,
        ExpenseDate: '',
        ExpenseDateFormat: '',
        maxDate: new Date(),
        minDate: new Date(),
        contactNo: '',
        contactNoFocused: false,
        emailId: '',
        emailIdFocused: false,
        comment: '',
        commentFocused: false,
        siteId: '',
        siteName: '',
        qCategoryID: '',
        qCategoryName: '',
        openDropdown: false,
        openCategoryDropdown: false,
        siteRef: {},
        categoryRef: {},
        site_all_data: [],
        site_all_data_copy: [],
        qCategory_all_data: [],
        qCategory_all_data_copy: [],
        voucherDetails: [],
        voucherHeads: [],
        incidents: [],
        visible: false,
        choosedVoucher: {},
        itemKey: null,
        itemValue: null,
        title: '',
        selectedItemId: null,
        file: [],
        incidentNo: '',
        showImageCaptureModal: false,
        type: '',
        itemList: [],
        expenseAmount: 0,
        openItemModal: false,
        showSnack: false,
        snackType: '',
        loading: false,

        openModal: false,
        modalMessage: '',
        alertFor: '',
        currentActionIndex: 0,
        currencySymbol: '',
        showVoucherListModal: false,
        isFormEditable: true,
        attachment: [],
        maxImages: 5
    };

    componentDidMount() {
        LogBox.ignoreLogs(['Animated: `useNativeDriver`', 'TypeError: Cannot read property']);
        this.fetchData();
        var dateOffset = (24*60*60*1000) * (this.props['userData']['configParam'] ? this.props['userData']['configParam']['maxVoucherDays'] ? this.props['userData']['configParam']['maxVoucherDays'] : 15 : 15);
        var maxDate = new Date();
        this.setState({
            minDate: maxDate.setTime(maxDate.getTime() - dateOffset)
        });
        if(this.props['route']['params']){
            var expenseData = this.props['route']['params'];
            expenseData['expenseDetail'].forEach((ex) => {
                ex['amount'] = ex['totalPrice'].toFixed(2);
            })
            this.setState({
                isFormEditable: false,
                ExpenseDate: expenseData['expenseDate'].split('T')[0].split('-').reverse().join('/'),
                siteName: expenseData['siteName'] ? expenseData['siteName'] : '--',
                siteId: expenseData['siteId'],
                qCategoryID: expenseData['qCategoryID'],
                qCategoryName: expenseData['qCategoryName'] ? expenseData['qCategoryName'] : '--',
                incidentNo: expenseData['incidentNo'] ? expenseData['incidentNo'] : '--',
                contactName: expenseData['contactName'] ? expenseData['contactName'] : '--',
                contactNo: expenseData['contactNo'] ? expenseData['contactNo'] : '--',
                emailId: expenseData['emailId'] ? expenseData['emailId'] : '--',
                comment: expenseData['comment'] ? expenseData['comment'] : '--',
                voucherDetails: expenseData['expenseDetail'] ? expenseData['expenseDetail'] : [],
                attachment: expenseData['attachment']
            }, () => {
                this.calculateAmount();
            })
            // this.setState({
            //     siteId: this.props['route']['params']['props']['siteID'],
            //     siteName: this.props['route']['params']['props']['siteName']
            // });
        }

        const [valueFormattedWithSymbol, valueFormattedWithoutSymbol, symbol] = formatCurrency({ amount: 0.00, code: userData['currencyCode'] ? userData['currencyCode'] : 'INR' });
        this.setState({
            currencySymbol: symbol
        });
         
    }

    componentWillUnmount(){
        
    }

    async onCrash(error_log: any) {
        crashlytics().log('Add voucher screen crash analytics');
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
                screen: 'Add Voucher',
                error: error.message,
                user: user ? JSON.stringify(user) : ''
            });
            crashlytics().crash();
        })
    }

    fetchData(){

        getService(urls.voucher_heads_all)
        .then((res: any) => {
            if(res.responseCode == 2000){
                this.setState({
                    voucherHeads: res.responseData.filter(f => f.enable)
                })
            }
        })
        .catch((error) => {
            
        });
        storage.runQuery(`select * from ${storage.site_tbl} order by siteName asc`)
        .then((res: any) => {
            res.forEach((s: any) => {
                s['isSelected'] = false;
                s['assets'] = JSON.parse(s['assets']);
                s['siteName'] = s['siteName']+` (${s['siteCode']})`;
            });

            this.setState({
                site_all_data: res,
                site_all_data_copy: res,
            });
        });
        
    }

    openDateModal = () => {
        this.setState({ isDatePickerVisible: true, isTimePickerVisible: false });
        if (this.state.ExpenseDate) {
            const dt: any = this.state.ExpenseDate.split('/');
            const month = parseInt(dt[1]) - 1;
            this.setState({ defaultDate: new Date(dt[2], month, dt[0]) });
        } else {
            this.setState({ defaultDate: new Date() });
        }
    };

    setDate = (date) => {
        this.setState({ isDatePickerVisible: false, isTimePickerVisible: false });
        if (date.type === 'set') {
            const dt = new Date(date.nativeEvent.timestamp);
            let getDate: any = dt.getDate();
            let getMonth: any = dt.getMonth()+1;
            if (getDate < 10) {
                getDate = `0${getDate}`;
            }
            if (getMonth < 10) {
                getMonth = `0${getMonth}`;
            }
            this.setState({ ExpenseDateFormat: `${getDate}-${MONTH_NAME[parseInt(getMonth) - 1]}-${dt.getFullYear()}` });
            this.setState({ ExpenseDate: `${getDate}/${getMonth}/${dt.getFullYear()}` });
        }
    };

    selectFile = async () => {
        try {
            const res = await DocumentPicker.pick({
                type: [DocumentPicker.types.pdf, 'image/jpeg', 'image/jpg', 'image/png'],
                allowMultiSelection: true,
                
            });
            
            if((this.state.file.length + res.length) > this.state.maxImages){
                this.setState({
                    showSnack: true,
                    snackType: 'error',
                    message: `Max ${this.state.maxImages} image are allowed`
                });

            }else{
                var isSameFileSelected = false;
                var all_file = JSON.parse(JSON.stringify(this.state.file));
                var saved_names = all_file.map((doc) => doc.name);
                
                res.forEach((file) => {
                    if(!saved_names.includes(file.name)){
                        all_file.push(file);
                    }else{
                        isSameFileSelected = true;
                    }
                });
                this.setState({
                    file: all_file
                });
                if(isSameFileSelected){
                    this.setState({
                        snackType: 'error',
                        showSnack: true,
                        message: 'Selected file already attached'
                    })
                }
            }
            // if(this.state.file.length < this.state.maxImages){
            //     this.selectFile();
            // }else{
            //     this.setState({
            //         showSnack: true,
            //         snackType: 'error',
            //         message: `Max ${this.state.maxImages} image are allowed`
            //     });
            // }
            
          // Setting the state to show single file attributes
        //   if(res[0]['size'] > 524288000){
        //     alert("File size must be less than 500 MB");
        //   }else {
        //     this.setState({
        //       video: res,
        //       uri: res[0].uri,
        //       canPlay: true,
        //       pauseVideo: false,
        //     });
        //   }
    
        } catch (err) {
            
        }
    };

    addVouchers(){
        var voucherDetails: Array<object> = JSON.parse(JSON.stringify(this.state.voucherDetails));
        voucherDetails.push({
            "index": voucherDetails.length,
            "expenseHeadCode": "",
            "expenseHeadName": "",
            "expenseItem": "",
            "qty": "",
            "unitPrice": "",
            "description": "",
            "show": true,
            "expenseHeadID": "",
            "amount": 0
        });
        this.setState({
            voucherDetails: voucherDetails
        })
    }

    saveExpense(){
        if(this.state.loading){
            return;
        }
        let formData = new FormData();
        const { ExpenseDateFormat, siteId, contactName, contactNo, emailId, qCategoryID, incidentNo, comment } = this.state;

        if(!ExpenseDateFormat){
            this.setState({
                showSnack: true,
                snackType: 'error',
                message: 'Expense date is required'
            });
            return;
        }
        if(!siteId){
            this.setState({
                showSnack: true,
                snackType: 'error',
                message: 'Site is required'
            });
            return;
        }
        if(!qCategoryID){
            this.setState({
                showSnack: true,
                snackType: 'error',
                message: 'Question category is required'
            });
            return;
        }
        if(!contactName){
            this.setState({
                showSnack: true,
                snackType: 'error',
                message: 'Contact name is required'
            });
            return;
        }
        if(!contactNo){
            this.setState({
                showSnack: true,
                snackType: 'error',
                message: 'Contact number is required'
            });
            return;
        }
        if(!comment){
            this.setState({
                showSnack: true,
                snackType: 'error',
                message: 'Comment is required'
            });
            return;
        }
        if(this.state.voucherDetails.length == 0){
            this.setState({
                showSnack: true,
                snackType: 'error',
                message: 'Voucher item is required'
            });
            return;
        }
        this.setState({
            loading: true
        });
        formData.append("expenseDate", ExpenseDateFormat.toString());
        formData.append("siteId", siteId.toString());
        formData.append("contactName", contactName.toString());
        formData.append("contactNo", contactNo.toString());
        formData.append("emailId", emailId.toString());
        formData.append("qCategoryID", qCategoryID.toString());
        formData.append("incidentNo", incidentNo.toString());
        formData.append("comment", comment.toString());
        
        this.state.file.forEach((file: object, index: number) => {
            file['uri'] = file['uri'].includes(':') ? file['uri'] : 'file://'+file['uri'];
            formData.append('voucherEvidenace', {
                name: encodeURIComponent(file['name']),
                uri: file['uri'], 
                type: file['type']
            } as any);
        });

        this.state.voucherDetails.forEach((voucher: object, index: number) => {
            formData.append(`voucherDetail[${index}].expenseHeadCode`, voucher['expenseHeadCode']);
            formData.append(`voucherDetail[${index}].expenseItem`, voucher['expenseItem']);
            formData.append(`voucherDetail[${index}].qty`, voucher['qty'].toString());
            formData.append(`voucherDetail[${index}].unitPrice`, voucher['unitPrice'].toString());
            formData.append(`voucherDetail[${index}].description`, voucher['description']);
        });

        postFormDataService(urls.voucher_create, formData)
        .then((res: any) => {
            setTimeout(() => {
                this.setState({
                    loading: false
                });
                if(res.responseCode == 2000){
                    this.resetState();
                    this.setState({
                        showSnack: true,
                        snackType: 'success',
                        message: 'Expense voucher submitted successfully'
                    });
                }else{
                    SendErrorLog('Screen => AddVoucherScreen > Method => saveExpense @ api => '+urls.voucher_create, JSON.stringify(res));
                    this.setState({
                        showSnack: true,
                        snackType: 'error',
                        message: 'Server error occured'
                    });
                }
            }, 2000);
            
        }).catch((error) => {
            this.setState({
                loading: false
            })
            this.setState({
                showSnack: true,
                snackType: 'error',
                message: 'Something went wrong, try again after sometime'
            });
            SendErrorLog('Screen => AddVoucherScreen > Method => saveExpense @ api => '+urls.voucher_create, JSON.stringify(error));
        })

    }

    resetState(){
        this.setState({
            showMessage: false,
            message: '',
            headerTitle: '',
            contactName: '',
            contactNameFocused: false,
            defaultDate: new Date(),
            isDatePickerVisible: false,
            isTimePickerVisible: false,
            ExpenseDate: '',
            ExpenseDateFormat: '',
            contactNo: '',
            contactNoFocused: false,
            emailId: '',
            emailIdFocused: false,
            comment: '',
            commentFocused: false,
            siteId: '',
            siteName: '',
            qCategoryID: '',
            qCategoryName: '',
            openDropdown: false,
            openCategoryDropdown: false,
            visible: false,
            choosedVoucher: {},
            itemKey: null,
            itemValue: null,
            title: '',
            selectedItemId: null,
            file: [],
            incidentNo: '',
            showImageCaptureModal: false,
            type: '',
            itemList: [],
            expenseAmount: 0,
            openItemModal: false,
            showSnack: false,
            snackType: '',
            loading: false,
            voucherDetails: []
        })
    }

    removeFile(file: object, index: number){
        
    }

    async openPreview(file: object){
        const path = await FileViewer.open(file['uri']) // absolute-path-to-my-local-file.
        .then(() => {
            
        })
        .catch((error) => {
            
        });
    }

    async openAttachmentPreview(file: string){
        
    }

    setVoucherExpense(selectedItem){
        var head = this.state.voucherHeads.filter((v: object) => v['expenseHeadID'] == selectedItem);
        var all_vouchers = JSON.parse(JSON.stringify(this.state.voucherDetails));
        all_vouchers[this.state.choosedVoucher['index']]['expenseHeadID'] = selectedItem ? selectedItem : "";
        all_vouchers[this.state.choosedVoucher['index']]['expenseHeadCode'] = head.length > 0 ? head[0]['expenseHeadCode'] : "";
        all_vouchers[this.state.choosedVoucher['index']]['expenseHeadName'] = head.length > 0 ? head[0]['expenseHeadName'] : "";

        this.setState({
            visible: false,
            voucherDetails: all_vouchers,
        });
    }

    setSiteType(selectedItem){
        var data = this.state.site_all_data.filter((v: object) => v['siteID'] == selectedItem);
        this.setState({
            visible: false,
            siteId: selectedItem,
            incidentNo: '',
            incidents: [],
            siteName: data.length > 0 ? data[0]['siteName'] : "",
            qCategoryID: '',
            qCategoryName: '',
        });
        // qCategory_all_data
        if(selectedItem){
            storage.runQuery(`select * from ${storage.user_category_tbl}`)
            .then((result: any) => {
                var ids: any = [];
                if(result.length){
                    ids = JSON.parse(result[0]['user_category']);
                }
                storage.runQuery(`select * from ${storage.question_category_tbl} where sTypeId = ${data[0]['sTypeId']}`)
                .then((res: any) => {
                    this.setState({
                        qCategory_all_data: res.filter(cat=>ids.includes(cat.qCategoryID)),
                        qCategory_all_data_copy: res.filter(cat=>ids.includes(cat.qCategoryID)),
                    });
                });
            })
            
            getService(`voucher/${selectedItem}/incidents`)
            .then((res: any) => {
                if(res.responseCode == 2000){
                    this.setState({
                        incidents: res.responseData
                    })
                }else{
                    this.setState({
                        incidents: []
                    })
                }
            })
            .catch((error) => {
                this.setState({
                    incidents: []
                });
            });
        }
    }

    setQuestionCategory(selectedItem){
        var data = this.state.qCategory_all_data.filter((v: object) => v['qCategoryID'] == selectedItem);
        this.setState({
            visible: false,
            qCategoryID: selectedItem,
            qCategoryName: data.length > 0 ? data[0]['qCategoryName'] : ""
        })
    }

    setIncident(selectedItem){
        var data = this.state.incidents.filter((v: object) => v['incidentNo'] == selectedItem);
        this.setState({
            visible: false,
            incidentNo: selectedItem ? selectedItem : "",
        })
    }

    saveItemDetail(data: object){
        var voucherDetails: Array<object> = JSON.parse(JSON.stringify(this.state.voucherDetails));
        var amount = ((data['qty'] ? parseInt(data['qty']) : 0) * (data['unitPrice'] ? (parseFloat(data['unitPrice']) as any).toFixed(2) : 0));
        voucherDetails.push({
            "index": voucherDetails.length,
            "expenseHeadCode": data["expenseHeadCode"],
            "expenseHeadName": data["expenseHeadName"],
            "expenseItem": data["expenseItem"],
            "qty": data["qty"],
            "unitPrice": (parseFloat(data['unitPrice']) as any).toFixed(2),
            "description": data["description"],
            "show": true,
            "expenseHeadID": data["expenseHeadID"],
            "amount": amount.toFixed(2)
        });

        this.setState({
            openItemModal: false,
            voucherDetails: voucherDetails
        }, () => {
            this.calculateAmount();
        })
    }

    calculateAmount(){
        var voucherDetails: Array<object> = JSON.parse(JSON.stringify(this.state.voucherDetails));
        var amount = 0;
        voucherDetails.forEach((voucher: any) => {
            // if(voucher['show']){
                amount = amount + ((voucher['qty'] ? parseInt(voucher['qty']) : 0) * (voucher['unitPrice'] ? (parseFloat(voucher['unitPrice']) as any).toFixed(2) : 0))
            // }
        });
        this.setState({
            expenseAmount: amount.toFixed(2)
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
                scrollEnabled={false}
                disableKeyboardBottom={false}
            >

                <View
                    style={{
                        flex: 1,
                        backgroundColor: colorLayout.appBgColor,
                    }}
                >

                    <ScrollView
                        scrollEnabled={true}
                        nestedScrollEnabled={true}
                        style={{
                            
                        }}
                    >
                        <View
                            style={{
                                paddingHorizontal: APP_PADDING,
                            }}
                        >

                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => {
                                    if(!this.state.isFormEditable){
                                        return;
                                    }
                                    this.openDateModal();
                                }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'flex-end',
                                    borderBottomColor: '#d3d3d3',
                                    borderBottomWidth: 1,
                                }}
                            >
                                <View
                                    style={{
                                        flex: 1
                                    }}
                                >
                                    <TextField
                                        label="Expense date"
                                        lineWidth={0}
                                        value={this.state.ExpenseDate}
                                        disabled={this.state.isFormEditable}
                                        editable={this.state.isFormEditable}
                                        disabledLineType={'solid'}
                                        disabledLineWidth={0}
                                        containerStyle={{
                                            
                                        }}
                                        inputContainerStyle={{
                                            paddingBottom: 0,
                                            paddingLeft: 5,
                                        }}
                                        titleTextStyle={{
                                            display: 'none'
                                        }} 
                                        fontSize={TEXT_SIZE_16}
                                        contentInset={{
                                            top: 10,
                                            input: 0,
                                            label: 2,
                                            bottom: 0
                                        }}
                                        baseColor={
                                            this.state.isFormEditable
                                            ?
                                            this.state.ExpenseDate ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                                            :
                                            "#d3d3d3"
                                        }
                                        tintColor={this.state.ExpenseDate ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                    />
                                </View>
                                <Icon
                                    name='calendar-outline'
                                    type='ionicon'
                                    size={22}
                                    color={this.state.ExpenseDate ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                    containerStyle={{
                                        marginBottom: 5
                                    }}
                                />
                            </TouchableOpacity>


                            {/* select site */}
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => {
                                    if(!this.state.isFormEditable){
                                        return;
                                    }
                                    if(this.state.site_all_data.length > 0){
                                        this.setState({
                                            visible: true,
                                            itemKey: 'siteID',
                                            itemValue: 'siteName',
                                            title: 'Site Name',
                                            selectedItemId: this.state.siteId,
                                            type: 'site',
                                            itemList: JSON.parse(JSON.stringify(this.state.site_all_data))
                                        });
                                    }else{
                                        this.setState({
                                            showSnack: true,
                                            snackType: 'error',
                                            message: 'Site is unavailable'
                                        })
                                    }
                                    
                                }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'flex-end',
                                    borderBottomColor: '#d3d3d3',
                                    borderBottomWidth: 1,
                                }}
                            >
                                <View
                                    style={{
                                        flex: 1,

                                    }}
                                >
                                    <TextField
                                        label={this.state.isFormEditable ? "Select site" : "Site name"}
                                        lineWidth={0}
                                        value={this.state.siteName}
                                        disabled={this.state.isFormEditable}
                                        editable={this.state.isFormEditable}
                                        disabledLineType={'solid'}
                                        disabledLineWidth={0}
                                        containerStyle={{
                                            // marginBottom: -9,
                                            // paddingLeft: 5
                                        }}
                                        inputContainerStyle={{
                                            paddingBottom: 0,
                                            paddingLeft: 5,
                                            
                                        }}
                                        titleTextStyle={{
                                            display: 'none'
                                        }} 
                                        fontSize={TEXT_SIZE_16}
                                        contentInset={{
                                            top: 10,
                                            input: 2,
                                            label: 8,
                                            bottom: 0
                                        }}
                                        baseColor={
                                            this.state.isFormEditable
                                            ?
                                            this.state.siteId ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                                            :
                                            "#d3d3d3"
                                        }
                                        tintColor={this.state.siteId ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                    />
                                </View>
                                <Icon
                                    name='chevron-down-outline'
                                    type='ionicon'
                                    size={22}
                                    color={this.state.siteId ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                    containerStyle={{
                                        marginBottom: 5
                                    }}
                                />
                            </TouchableOpacity>
                                
                                
                            {/* select question category */}
                            <View
                                style={{
                                    position: 'relative',
                                    marginTop: 5
                                }}
                            >
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => {
                                        if(!this.state.isFormEditable){
                                            return;
                                        }
                                        if(!this.state.siteName){
                                            this.setState({
                                                showSnack: true,
                                                snackType: 'error',
                                                message: 'Please select site'
                                            });
                                            return;
                                        }
                                        if(this.state.qCategory_all_data.length > 0){
                                            this.setState({
                                                visible: true,
                                                itemKey: 'qCategoryID',
                                                itemValue: 'qCategoryName',
                                                title: 'Category Name',
                                                selectedItemId: this.state.qCategoryID,
                                                type: 'question',
                                                itemList: JSON.parse(JSON.stringify(this.state.qCategory_all_data))
                                            });
                                        }else{
                                            this.setState({
                                                showSnack: true,
                                                snackType: 'error',
                                                message: 'Question category is unavailable'
                                            })
                                        }
                                        
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'flex-end',
                                        // borderBottomColor: this.state.qCategoryID ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5'),
                                        // borderBottomWidth: this.state.qCategoryID ? 2 : 0.7,
                                        marginTop: -5,
                                        borderBottomColor: '#d3d3d3',
                                        borderBottomWidth: 1
                                    }}
                                >
                                    <View
                                        style={{
                                            flex: 1
                                        }}
                                    >
                                        <TextField
                                            label={this.state.isFormEditable ? "Select question category" : "Question Category"}
                                            lineWidth={0}
                                            value={this.state.qCategoryName}
                                            disabled={this.state.isFormEditable}
                                            editable={this.state.isFormEditable}
                                            disabledLineType={'solid'}
                                            disabledLineWidth={0}
                                            inputContainerStyle={{
                                                paddingBottom: 0,
                                                paddingLeft: 5,
                                            }}
                                            titleTextStyle={{
                                                display: 'none'
                                            }} 
                                            fontSize={TEXT_SIZE_16}
                                            contentInset={{
                                                top: 10,
                                                input: 2,
                                                label: 8,
                                                bottom: 0
                                            }}
                                            baseColor={
                                                this.state.isFormEditable
                                                ?
                                                this.state.qCategoryID ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                                                :
                                                "#d3d3d3"
                                            }
                                            tintColor={this.state.qCategoryID ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                        />
                                    </View>
                                    <Icon
                                        name='chevron-down-outline'
                                        type='ionicon'
                                        size={22}
                                        color={this.state.qCategoryID ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                        containerStyle={{
                                            marginBottom: 5
                                        }}
                                    />
                                </TouchableOpacity>
                                
                                
                            </View>

                            {/* select incidents */}
                            <View
                                style={{
                                    position: 'relative',
                                    marginTop: 5
                                }}
                            >
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => {
                                        if(!this.state.isFormEditable){
                                            return;
                                        }
                                        if(!this.state.siteName){
                                            this.setState({
                                                showSnack: true,
                                                snackType: 'error',
                                                message: 'Please select site'
                                            });
                                            return;
                                        }
                                        if(this.state.incidents.length > 0){
                                            this.setState({
                                                visible: true,
                                                itemKey: 'incidentNo',
                                                itemValue: 'incidentNo',
                                                title: 'Incidents',
                                                selectedItemId: this.state.incidentNo,
                                                type: 'incident',
                                                itemList: JSON.parse(JSON.stringify(this.state.incidents))
                                            });
                                        }else{
                                            this.setState({
                                                showSnack: true,
                                                snackType: 'error',
                                                message: 'Incidents is unavailable'
                                            })
                                        }
                                        
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'flex-end',
                                        borderBottomColor: '#d3d3d3',
                                        borderBottomWidth: 1,
                                        // marginTop: -5,
                                    }}
                                >
                                    <View
                                        style={{
                                            flex: 1
                                        }}
                                    >
                                        <TextField
                                            label={this.state.isFormEditable ? "Select incident" : "Incident"}
                                            lineWidth={0}
                                            value={this.state.incidentNo}
                                            disabled={this.state.isFormEditable}
                                            editable={this.state.isFormEditable}
                                            disabledLineType={'solid'}
                                            disabledLineWidth={0}
                                            containerStyle={{
                                                // marginBottom: -9,
                                                // paddingLeft: 5
                                            }}
                                            inputContainerStyle={{
                                                paddingBottom: 0,
                                                paddingLeft: 5,
                                                
                                            }}
                                            titleTextStyle={{
                                                display: 'none'
                                            }} 
                                            fontSize={TEXT_SIZE_16}
                                            contentInset={{
                                                top: 10,
                                                input: 2,
                                                label: 8,
                                                bottom: 0
                                            }}
                                            baseColor={
                                                this.state.isFormEditable
                                                ?
                                                this.state.incidentNo ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                                                :
                                                "#d3d3d3"
                                            }
                                            tintColor={this.state.incidentNo ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                        />
                                    </View>
                                    <Icon
                                        name='chevron-down-outline'
                                        type='ionicon'
                                        size={22}
                                        color={this.state.incidentNo ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                        containerStyle={{
                                            marginBottom: 5
                                        }}
                                    />
                                </TouchableOpacity>
                                
                                
                            </View>

                            <View
                                style={{
                                    
                                }}
                            >
                                
                            <TextField
                                label="Contact name"
                                lineWidth={ this.state.isFormEditable ? this.state.contactNameFocused ? 2 : this.state.contactName ? 2 : 1 : 1.5}
                                value={this.state.contactName}
                                
                                onChangeText={(text: string) => {
                                    if(text.length < 51){
                                        this.setState({ contactName: AlphaNumericPattern(text.slice(0, 50)) });
                                    }
                                }}
                                baseColor={
                                    this.state.isFormEditable
                                    ?
                                    this.state.contactNameFocused 
                                    ? 
                                    colorLayout.subHeaderBgColor : this.state.contactName ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                                    :
                                    '#d3d3d3'
                                }
                                tintColor={
                                    this.state.contactNameFocused 
                                    ? 
                                    colorLayout.subHeaderBgColor : this.state.contactName ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                                }
                                characterRestriction={50}
                                onFocus={() => {
                                    this.setState({
                                        contactNameFocused: true
                                    })
                                }} 
                                onBlur={() => {
                                    this.setState({
                                        contactNameFocused: false
                                    })
                                }}
                                containerStyle={{
                                    
                                }}
                                inputContainerStyle={{
                                    paddingBottom: 0,
                                    paddingLeft: 5,
                                }}
                                titleTextStyle={{
                                    display: 'none'
                                }} 
                                fontSize={TEXT_SIZE_16}
                                contentInset={{
                                    top: 10,
                                    input: 2,
                                    label: 8,
                                    bottom: 0
                                }}
                                editable={this.state.isFormEditable}
                                disabledLineType={'solid'}
                            />
                            </View>

                            <View
                                style={{
                                    
                                }}
                            >
                                
                                <TextField
                                    label="Contact number"
                                    lineWidth={this.state.isFormEditable ? this.state.contactNoFocused ? 2 : this.state.contactNo ? 2 : 1: 1.5}
                                    value={this.state.contactNo}
                                    keyboardType="phone-pad"
                                    onChangeText={(text: string) => {
                                        if(text.length < 11){
                                            this.setState({ contactNo: NumericPattern(text.slice(0, 10)) });
                                        }
                                    }}
                                    baseColor={
                                        this.state.isFormEditable
                                        ?
                                        this.state.contactNoFocused 
                                        ? 
                                        colorLayout.subHeaderBgColor : this.state.contactNo ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                                        :
                                        "#d3d3d3"
                                    }
                                    tintColor={
                                        this.state.contactNoFocused 
                                        ? 
                                        colorLayout.subHeaderBgColor : this.state.contactNo ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                                    }
                                    characterRestriction={10}
                                    onFocus={() => {
                                        this.setState({
                                            contactNoFocused: true
                                        })
                                    }} 
                                    onBlur={() => {
                                        this.setState({
                                            contactNoFocused: false
                                        })
                                    }}
                                    containerStyle={{
                                        // marginBottom: -9,
                                        // paddingLeft: 5
                                    }}
                                    inputContainerStyle={{
                                        paddingBottom: 0,
                                        paddingLeft: 5,
                                        
                                    }}
                                    titleTextStyle={{
                                        display: 'none'
                                    }} 
                                    fontSize={TEXT_SIZE_16}
                                    contentInset={{
                                        top: 10,
                                        input: 2,
                                        label: 8,
                                        bottom: 0
                                    }}
                                    editable={this.state.isFormEditable}
                                />
                            </View>


                            <View
                                style={{
                                    
                                }}
                            >
                                
                                <TextField
                                    label="Email id"
                                    lineWidth={this.state.isFormEditable ? this.state.emailIdFocused ? 2 : this.state.emailId ? 2 : 1 : 1.5}
                                    value={this.state.emailId}
                                    onChangeText={(text: string) => {
                                        if(text.length < 46){
                                            this.setState({ emailId: text.slice(0, 45) });
                                        }
                                    }}
                                    baseColor={
                                        this.state.isFormEditable
                                        ?
                                        this.state.emailIdFocused 
                                        ? 
                                        colorLayout.subHeaderBgColor : this.state.emailId ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                                        :
                                        "#d3d3d3"
                                    }
                                    tintColor={
                                        this.state.emailIdFocused 
                                        ? 
                                        colorLayout.subHeaderBgColor : this.state.emailId ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                                    }
                                    characterRestriction={45}
                                    onFocus={() => {
                                        this.setState({
                                            emailIdFocused: true
                                        })
                                    }} 
                                    onBlur={() => {
                                        this.setState({
                                            emailIdFocused: false
                                        })
                                    }} containerStyle={{
                                        // marginBottom: -9,
                                        // paddingLeft: 5
                                    }}
                                    inputContainerStyle={{
                                        paddingBottom: 0,
                                        paddingLeft: 5,
                                        
                                    }}
                                    titleTextStyle={{
                                        display: 'none'
                                    }} 
                                    fontSize={TEXT_SIZE_16}
                                    contentInset={{
                                        top: 10,
                                        input: 2,
                                        label: 8,
                                        bottom: 0
                                    }}
                                    editable={this.state.isFormEditable}
                                />
                            </View>

                            <View
                                style={{
                                    
                                }}
                            >
                                
                                <TextField
                                    label="Comment"
                                    lineWidth={this.state.isFormEditable ? this.state.commentFocused ? 2 : this.state.comment ? 2 : 1 : 1.5}
                                    value={this.state.comment}
                                    onChangeText={(text: string) => {
                                        this.setState({ comment: text.slice(0, 250) });
                                    }}
                                    baseColor={
                                        this.state.isFormEditable
                                        ?
                                        this.state.commentFocused 
                                        ? 
                                        colorLayout.subHeaderBgColor : this.state.comment ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                                        :
                                        "#d3d3d3"
                                    }
                                    tintColor={
                                        this.state.commentFocused 
                                        ? 
                                        colorLayout.subHeaderBgColor : this.state.comment ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')
                                    }
                                    characterRestriction={250}
                                    onFocus={() => {
                                        this.setState({
                                            commentFocused: true
                                        })
                                    }} 
                                    onBlur={() => {
                                        this.setState({
                                            commentFocused: false
                                        })
                                    }}
                                    containerStyle={{
                                        // marginBottom: -9,
                                        // paddingLeft: 5
                                    }}
                                    inputContainerStyle={{
                                        paddingBottom: 0,
                                        paddingLeft: 5,
                                        
                                    }}
                                    titleTextStyle={{
                                        display: 'none'
                                    }} 
                                    fontSize={TEXT_SIZE_16}
                                    contentInset={{
                                        top: 10,
                                        input: 2,
                                        label: 8,
                                        bottom: 0
                                    }}
                                    editable={this.state.isFormEditable}
                                />
                            </View>

                            <View
                                style={{
                                    paddingVertical: 2*APP_PADDING,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginHorizontal: -APP_PADDING
                                }}
                            >
                                <View
                                    style={{
                                        ...styles.shadow_box,
                                        marginVertical: 0
                                    }}
                                >
                                    <View 
                                        
                                        style={{
                                            ...styles.capture_btn,
                                            backgroundColor: '#fff',
                                        }}
                                    >
                                        <Text
                                        style={{
                                            color: colorLayout.subTextColor,
                                            fontSize: TEXT_SIZE_14
                                        }}
                                    >
                                        Total - 
                                    </Text>
                                    <Text
                                        style={{
                                            paddingHorizontal: APP_PADDING,
                                            color: colorLayout.subTextColor,
                                            fontSize: TEXT_SIZE_14,
                                            fontWeight: '900'
                                        }}
                                    >
                                        {this.state.currencySymbol} {this.state.expenseAmount}
                                    </Text>
                                    </View>
                                    
                                </View>
                                

                                {
                                    this.state.isFormEditable &&
                                    
                                    <View
                                        style={{
                                            ...styles.shadow_box,
                                            marginVertical: 0
                                        }}
                                    >
                                        
                                        <TouchableOpacity 
                                            onPress={() => {
                                                this.setState({
                                                    openItemModal: true
                                                })
                                            }} 
                                            style={{
                                                ...styles.capture_btn,
                                                backgroundColor: colorLayout.subHeaderBgColor,
                                            }}
                                            activeOpacity={0.8}
                                        >
                                                <Icon
                                                    name='plus'
                                                    type='font-awesome'
                                                    color={colorLayout.headerTextColor}
                                                    containerStyle={{
                                                        
                                                    }}
                                                    iconStyle={{
                                                        fontSize: 20,
                                                    }}
                                                    
                                                />
                                                <Text
                                                    style={{
                                                        fontSize: TEXT_SIZE_14,
                                                        color: colorLayout.headerTextColor,
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    Voucher Item
                                                </Text>
                                        </TouchableOpacity>
                                    </View>
                                }
                                {
                                    !this.state.isFormEditable &&
                                    
                                    <View
                                        style={{
                                            ...styles.shadow_box,
                                            marginVertical: 0
                                        }}
                                    >
                                        
                                        <TouchableOpacity 
                                            style={{
                                                ...styles.capture_btn, 
                                                backgroundColor: '#fff', 
                                            }}
                                            activeOpacity={1}
                                            onPress={() => {
                                                this.setState({
                                                    showVoucherListModal: true
                                                });
                                            }}
                                        >
                                        
                                            <Icon
                                                name='ticket'
                                                type='font-awesome'
                                                color={colorLayout.subTextColor}
                                                containerStyle={{
                                                    
                                                }}
                                                iconStyle={{
                                                    fontSize: 22,
                                                }}
                                            />
                                            <Text
                                            style={{
                                                fontSize: TEXT_SIZE_14,
                                                color: colorLayout.subTextColor,
                                                fontWeight: '600'
                                            }}
                                        >
                                            {this.state.voucherDetails.length}
                                        </Text>
                                        </TouchableOpacity>
                                    </View>
                                }
                            </View>


                            {
                                this.state.isFormEditable &&
                                
                                <View
                                    style={{
                                        paddingVertical: PADDING_16,
                                        display: this.state.voucherDetails.length > 0 ? 'flex' : 'none',
                                        marginTop: -22
                                    }}
                                >
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-around',
                                            marginHorizontal: -APP_PADDING,
                                        }}
                                    >
                                        <View
                                            style={{
                                                ...styles.shadow_box
                                            }}
                                        >
                                            <TouchableOpacity 
                                                onPress={() => {
                                                    this.setState({
                                                        showVoucherListModal: true
                                                    });
                                                }} 
                                                style={{
                                                    ...styles.capture_btn, 
                                                    backgroundColor: '#fff', 
                                                }}
                                                activeOpacity={0.8}
                                            >
                                            <Text
                                                style={{
                                                    fontSize: TEXT_SIZE_14,
                                                    color: colorLayout.subTextColor,
                                                    fontWeight: '600'
                                                }}
                                            >
                                                Total Voucher - {this.state.voucherDetails.length}
                                            </Text>
                                                <Icon
                                                    name='ticket'
                                                    type='font-awesome'
                                                    color={colorLayout.subTextColor}
                                                    containerStyle={{
                                                        
                                                    }}
                                                    iconStyle={{
                                                        fontSize: 22,
                                                    }}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    
                                    </View>

                                </View> 
                            }
                            
                            {
                                this.state.isFormEditable &&
                                <View
                                    style={{
                                        paddingVertical: APP_PADDING,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginHorizontal: -APP_PADDING,
                                        paddingBottom: 2*APP_PADDING,
                                        justifyContent: 'space-between',
                                        marginTop: -APP_PADDING
                                    }}
                                >
                                    <View
                                        style={{
                                            ...styles.shadow_box,
                                            marginVertical: 0,
                                            flex: 1
                                        }}
                                    >
                                        <View 
                                            style={{
                                                ...styles.capture_btn,
                                                backgroundColor: '#fff',
                                                flex: 1,
                                            }}
                                        >
                                            <Text
                                            style={{
                                                color: colorLayout.subTextColor,
                                                fontSize: TEXT_SIZE_14
                                            }}
                                        >
                                            Voucher Photo - 
                                        </Text>
                                        <Text
                                            style={{
                                                paddingHorizontal: APP_PADDING,
                                                color: colorLayout.subTextColor,
                                                fontSize: TEXT_SIZE_14,
                                                fontWeight: '900'
                                            }}
                                        >
                                            {this.state.file.length}
                                        </Text>
                                        </View>
                                        
                                    </View>
                                        
                                    <View
                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            flexGrow: 1,
                                            flexBasis: 20
                                        }}
                                    >

                                        <View
                                            style={{
                                                ...styles.shadow_box,
                                                marginVertical: 0,
                                                flex: 1,
                                            }}
                                        >
                                            
                                            <TouchableOpacity 
                                                onPress={() => {
                                                    if(this.state.file.length < this.state.maxImages){
                                                        this.setState({
                                                            showImageCaptureModal: true
                                                        })
                                                    }else{
                                                        this.setState({
                                                            showSnack: true,
                                                            snackType: 'error',
                                                            message: `Max ${this.state.maxImages} image are allowed`
                                                        });
                                                    }
                                                    // if(this.state.file.filter((f: any) => f.upload_type == 'capture').length >= 5){
                                                    //     this.setState({
                                                    //         showSnack: true,
                                                    //         snackType: 'error',
                                                    //         message: 'Image capture limit reached'
                                                    //     })
                                                    // }else{
                                                    //     this.setState({
                                                    //         showImageCaptureModal: true
                                                    //     })
                                                    // }
                                                }} 
                                                style={{
                                                    ...styles.capture_btn,
                                                    backgroundColor: colorLayout.subHeaderBgColor,
                                                    alignItems: 'center',
                                                    alignContent: 'center',
                                                    flex: 1
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <Icon
                                                    name='camera'
                                                    type='font-awesome'
                                                    color={colorLayout.headerTextColor}
                                                    containerStyle={{
                                                        alignSelf: 'center',
                                                        width: '100%'
                                                    }}
                                                    iconStyle={{
                                                        fontSize: 20,
                                                    }}
                                                    
                                                />
                                            </TouchableOpacity>
                                        </View>

                                        <View
                                            style={{
                                                ...styles.shadow_box,
                                                marginVertical: 0,
                                            }}
                                        >
                                            
                                            <TouchableOpacity 
                                                onPress={() => {
                                                    if(this.state.file.length < this.state.maxImages){
                                                        this.selectFile();
                                                    }else{
                                                        this.setState({
                                                            showSnack: true,
                                                            snackType: 'error',
                                                            message: `Max ${this.state.maxImages} image are allowed`
                                                        });
                                                    }
                                                }} 
                                                style={{
                                                    ...styles.capture_btn,
                                                    backgroundColor: colorLayout.subHeaderBgColor,
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <Icon
                                                    name='paperclip'
                                                    type='font-awesome'
                                                    color={colorLayout.headerTextColor}
                                                    containerStyle={{
                                                        alignSelf: 'center',
                                                        width: '100%'
                                                    }}
                                                    iconStyle={{
                                                        fontSize: 20,
                                                    }}
                                                    
                                                />
                                            </TouchableOpacity>
                                        </View>
                                        

                                    </View>
                                </View>
                            }


                            <View
                                style={{
                                    ...styles.shadow_box,
                                    marginHorizontal: 0,
                                    marginBottom: 30,
                                    marginTop: -7
                                }}
                            >
                                
                                <View
                                    style={{
                                        width: '100%'
                                    }}
                                >
                                    

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        padding: 5,
                                        backgroundColor: colorLayout.subHeaderBgColor,
                                        display: this.state.file.length > 0 ? 'flex' : 'none',
                                    }}
                                >


                                        <View style={{ width: 60 }}>
                                            <Text style={{color: colorLayout.headerTextColor, fontWeight: '600'}}>
                                                SN.
                                            </Text>
                                        </View>

                                        <View style={{flex: 1, alignItems: 'flex-start'}}>
                                            <Text style={{color: colorLayout.headerTextColor, fontWeight: '600', textAlign: 'center'}}>
                                                Name
                                            </Text>
                                        </View>

                                        <View style={{ }}>
                                            <Text style={{color: colorLayout.headerTextColor, fontWeight: '600', textAlign: 'center'}}>
                                                Remove
                                            </Text>
                                        </View>
                                    
                                </View>

                                <View
                                    style={{
                                        marginBottom: 0
                                    }}
                                >
                                {
                                    this.state.file.map((file: any, index: number) => {
                                        return (
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'space-between',
                                                    padding: 5,
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: '#d3d3d3'
                                                }}
                                                key={index}
                                            >


                                                <View style={{ width: 60 }}>
                                                    <Text style={{color: colorLayout.subTextColor, ...styles.assets}}>
                                                        {index + 1}
                                                    </Text>
                                                </View>

                                                <View style={{flex: 1, alignItems: 'flex-start'}}>
                                                    <TouchableOpacity
                                                        onPress={()=>{
                                                            this.openPreview(file);
                                                        }}
                                                    >
                                                        <Text style={{color: colorLayout.subTextColor, ...styles.assets, textAlign: 'center', textDecorationLine: 'underline'}}>
                                                            {file.name}
                                                        </Text>
                                                    </TouchableOpacity>
                                                    
                                                </View>

                                                <View style={{ }}>

                                                    <TouchableOpacity
                                                            style={{
                                                                backgroundColor: '#ff0000',
                                                                width: 24,
                                                                height: 24,
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                borderRadius: 50
                                                            }}
                                                            onPress={() => {
                                                                this.setState({
                                                                    currentActionIndex: index,
                                                                    openModal: true,
                                                                    modalMessage: 'Are you sure want to remove attachment ?',
                                                                    alertFor: 'file',
                                                                })
                                                            }}
                                                        >
                                                        <View
                                                            style={{
                                                                shadowColor: '#000',
                                                                shadowOffset: {
                                                                    width: 0,
                                                                    height: 0
                                                                },
                                                                shadowOpacity: 1,
                                                                shadowRadius: 3,
                                                                elevation: 20,
                                                                borderRadius: 50
                                                            }}
                                                        >
                                                            <View
                                                                style={{
                                                                    shadowColor: '#000',
                                                                    shadowOffset: {
                                                                        width: 0,
                                                                        height: 0
                                                                    },
                                                                    shadowOpacity: 1,
                                                                    shadowRadius: 3,
                                                                    elevation: 10,
                                                                }}
                                                            >
                                                                    <Icon
                                                                        name='trash-o'
                                                                        type='font-awesome'
                                                                        color={'#fff'}
                                                                        containerStyle={{
                                                                            
                                                                        }}
                                                                        iconStyle={{
                                                                            fontSize: 16,
                                                                        }}
                                                                        onPress={() => {
                                                                            this.setState({
                                                                                currentActionIndex: index,
                                                                                openModal: true,
                                                                                modalMessage: 'Are you sure want to remove item ?',
                                                                                alertFor: 'file',
                                                                            })
                                                                        }}
                                                                    />
                                                            </View>
                                                        </View>
                                                                </TouchableOpacity>
                                                
                                                </View>
                                            
                                            </View>
                                        );
                                    })
                                }
                                    
                                </View>
                                </View>

                            </View>

                            {
                                !this.state.isFormEditable &&
                                <View
                                    style={{
                                        ...styles.shadow_box,
                                        marginHorizontal: 0,
                                        marginBottom: 30,
                                        marginTop: -7
                                    }}
                                >
                                
                                    <View
                                        style={{
                                            width: '100%'
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                padding: 5,
                                                backgroundColor: colorLayout.subHeaderBgColor,
                                                display: this.state.attachment.length > 0 ? 'flex' : 'none',
                                            }}
                                        >
                                                <View style={{ width: 60 }}>
                                                    <Text style={{color: colorLayout.headerTextColor, fontWeight: '600'}}>
                                                        SN.
                                                    </Text>
                                                </View>

                                                <View style={{flex: 1, alignItems: 'flex-start'}}>
                                                    <Text style={{color: colorLayout.headerTextColor, fontWeight: '600', textAlign: 'center'}}>
                                                        Name
                                                    </Text>
                                                </View>
                                            
                                        </View>

                                        <View
                                            style={{
                                                marginBottom: 0
                                            }}
                                        >
                                        {
                                            this.state.attachment.map((file: any, index: number) => {
                                                return (
                                                    <View
                                                        style={{
                                                            flexDirection: 'row',
                                                            justifyContent: 'space-between',
                                                            padding: 5,
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#d3d3d3'
                                                        }}
                                                        key={index}
                                                    >


                                                        <View style={{ width: 60 }}>
                                                            <Text style={{color: colorLayout.subTextColor, ...styles.assets}}>
                                                                {index + 1}
                                                            </Text>
                                                        </View>

                                                        <View style={{flex: 1, alignItems: 'flex-start'}}>
                                                            <TouchableOpacity
                                                                onPress={()=>{
                                                                    this.openAttachmentPreview(file);
                                                                }}
                                                            >
                                                                <Text style={{color: colorLayout.subTextColor, ...styles.assets, textAlign: 'center', textDecorationLine: 'underline'}}>
                                                                    {file}
                                                                </Text>
                                                            </TouchableOpacity>
                                                            
                                                        </View>
                                                    
                                                    </View>
                                                );
                                            })
                                        }
                                            
                                        </View>
                                    </View>

                                </View>
                            }   
                            
                            
                        </View>
                    </ScrollView>
                    

                    {
                        this.state.isFormEditable &&
                        <View
                            style={{
                                padding: APP_PADDING,
                                backgroundColor: colorLayout.appBgColor,
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >

                            <View
                                style={{
                                    
                                }}
                            >
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: colorLayout['subHeaderBgColor'],
                                        position: 'relative',
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        paddingVertical: PADDING_14,
                                        borderRadius: BTN_BORDER_RADIUS,
                                        width: SCREEN_WIDTH - (2 * APP_PADDING),
                                        opacity: this.state.loading ? 0.7 : 1
                                    }}
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        this.saveExpense();
                                    }}
                                    disabled={this.state.loading}
                                    activeOpacity={0.9}
                                >

                                    <Text
                                        style={{
                                            color: colorLayout['headerTextColor'],
                                            fontSize: TEXT_SIZE_16,
                                            textAlignVertical: 'center',
                                            fontWeight: '500',
                                            textAlign: 'center'
                                        }}
                                    >
                                        Save
                                    </Text>

                                </TouchableOpacity>
                            </View>
                            
                        </View> 
                    }
                </View>
                    

                <DropdownItem
                    title={this.state.title}
                    visible={this.state.visible}
                    list={this.state.itemList}
                    itemKey={this.state.itemKey}
                    itemValue={this.state.itemValue}
                    onClose={() => {
                        this.setState({
                            visible: false
                        });
                    }}
                    onSelectItem={(selectedItem) => {
                        if(this.state.type == 'expense'){
                            this.setVoucherExpense(selectedItem);
                        }
                        if(this.state.type == 'site'){
                            this.setSiteType(selectedItem);
                        }
                        if(this.state.type == 'question'){
                            this.setQuestionCategory(selectedItem);
                        }
                        if(this.state.type == 'incident'){
                            this.setIncident(selectedItem);
                        }
                        
                    }}
                    selectedItemId={this.state.selectedItemId}
                    
                />
                
                { this.state.isDatePickerVisible && 
                    <DateTimePicker
                        value={this.state.defaultDate}
                        mode={'date'}
                        onChange={this.setDate}
                        maximumDate={this.state.maxDate}
                        minimumDate={new Date(this.state.minDate)}
                    />
                }

                <CaptureImageComponent
                    visible={this.state.showImageCaptureModal}
                    onClose={() => {
                        this.setState({
                            showImageCaptureModal: false
                        })
                    }}
                    onSubmit={(img, a, b) => {
                        this.setState({
                            showImageCaptureModal: false
                        });

                        var all_file = JSON.parse(JSON.stringify(this.state.file));
                        var captured_times = all_file.map((f: any) => f.capture_time);
                        img.forEach((file) => {
                            if(!captured_times.includes(file.capture_time)){
                                file.upload_type = 'capture';
                                file.type = 'image/jpeg';
                                all_file.push(file);
                            }
                        })
                        this.setState({
                            file: all_file
                        });
                    }}
                    length={this.state.maxImages - this.state.file.filter((f => f['upload_type'] !== 'capture')).length}
                    imagesSaved={true}
                    file={this.state.file.filter((f => f['upload_type'] == 'capture'))}
                    fileLength={this.state.file.length}
                />

                <ShowVoucherList
                    visible={this.state.showVoucherListModal}
                    currencySymbol={this.state.currencySymbol}
                    voucherList={this.state.voucherDetails}
                    expenseAmount={this.state.expenseAmount}
                    props={this.props}
                    onClose={() => {
                        this.setState({
                            showVoucherListModal: false
                        })
                    }}
                    onSubmit={(vouchers) => {
                        this.setState({
                            showVoucherListModal: false,
                            voucherDetails: vouchers
                        }, () => {
                            this.calculateAmount();
                        })
                    }}
                    voucherHeads={this.state.voucherHeads}
                    isFormEditable={this.state.isFormEditable}
                />

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

                <AddItem 
                    visible={this.state.openItemModal}
                    onDismiss={(data: object) => {
                        this.saveItemDetail(data);
                    }}
                    onClose={() => {
                        this.setState({
                            openItemModal: false
                        })
                    }}
                    headerTitle={'Add Voucher Item'}
                    colorLayout={colorLayout}
                    animation={'fade'}
                    OkText='Save'
                    itemList={this.state.voucherHeads}
                    currencySymbol={this.state.currencySymbol}
                ></AddItem>

                
                <Snackbar
                    visible={this.state.showSnack}
                    onDismiss={() => {
                        this.setState({
                            showSnack: false
                        })
                    }}
                    style={{
                        backgroundColor: this.state.snackType == 'error' ? color.danger : this.state.snackType == 'success' ? color.success : colorLayout.headerBgColor,
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
                

                <AlertComponent 
                    message={this.state.modalMessage} 
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
                            
                            if(this.state.alertFor == 'file'){
                                var list = JSON.parse(JSON.stringify(this.state.file));
                                list.splice(this.state.currentActionIndex, 1);
                                this.setState({
                                    file: list
                                })
                            }
                        })

                    }}
                    headerTitle="Confirmation"
                    okText={'Yes'}
                    cancelText={'No'}
                ></AlertComponent>

                {
                    this.state.loading &&
                    <Spinner
                        visible={true}
                        textContent={''}
                        textStyle={{
                            color: colorLayout['subHeaderBgColor'],
                            fontSize: 16,
                            marginTop: -42
                        }}
                        overlayColor={'rgba(0, 0, 0, 0.2)'}
                        color={colorLayout['subHeaderBgColor']}
                        customIndicator={
                            <ActivityIndicator 
                                style={{
                                    opacity: 1,
                                }}
                                size={72}
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
    capture_btn: {
        backgroundColor: '#062656',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 20,
        flex: 1,
        paddingVertical: PADDING_10,
        borderRadius: BTN_BORDER_RADIUS,
        paddingHorizontal: APP_PADDING,
    },
    action_btn:{
        alignItems: 'center',
        paddingVertical: PADDING_12,
        borderRadius: BTN_BORDER_RADIUS,
        flexDirection: 'row'
    },
    assets: {
        fontWeight: '600',
    },
    voucher_card: {
        backgroundColor: '#fff',
        borderRadius: CARD_BORDER_RADIUS,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 4,
        marginVertical: APP_PADDING,
        alignItems: 'flex-end'
    },
    shadow_box:{
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        borderRadius: CARD_BORDER_RADIUS,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowOpacity: 0.4,
        elevation: 4,
        marginVertical: PADDING_6,
        marginHorizontal: APP_PADDING
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

export default connect(mapStateToProps, mapDispatchToProps)(AddVoucher);
