/* eslint-disable max-len */
import { actionTypes } from '../../utilities/constants';

const INITIAL_STATE = {
    loading: false,
    UserLoggedIn: false,
    userData: null,
    colorLayout: null,
    allSites: [],
    allSiteType: null,
    inspectedSurvey: null,


    count: 0,
    index: 0,
    patientRecord: null,
    CheckupDetail: [],
    Vital: null,
    PreviewRecord: null,
    CopiedMedicalData: null,
    ForwardData: false,
    CanSetMedicalData: true,
    IsPreviewDataSaved: false,
    MedicalHistoryData: [],
    HistoryFilterDropdown: [],

    selectedService: null,
    totalSyncedSurvey: 0,
    basePath: null,
    updateOfflineSurveyCount: 0,
    serverSyncedSurveyCount: 0,

    siteId: 0,
    sTypeId: 0,
    inspectionStartTiming: 0,
    questions: [],
    inspection: null,
    userCategoryQuestions: [],
    siteData: null
};

export default (state = INITIAL_STATE, { type, payload }) => {
    switch (type) {
        case 'LOADING':
            return {
                ...state,
                loading: payload
            };
        case actionTypes.LOGIN_REQUESTED:
            return { ...state };
            // return { ...state, loading: true, patientRecord: null, CheckupDetail: [], Vital: null, PreviewRecord: null, CopiedMedicalData: null };
        case actionTypes.LOGIN_SUCCEEDED:
        case actionTypes.AUTH_LOADING_STOPPED:
            return { ...state, loading: false };

        case actionTypes.USER_DATA:
            return { 
                ...state,
                userData: payload.data
            };
        
        case 'basePath':
            return {
                ...state,
                basePath: payload.data
            }

        case 'COLOR_LAYOUT':
            return {
                ...state,
                colorLayout: payload.colors
            }

        case 'All_SITES':
            return {
                ...state,
                allSites: payload
            }

        case 'All_SITE_TYPE':
            return {
                ...state,
                allSiteType: payload.data
            }
            

        case 'INSPECTED_SURVEY':
            return {
                ...state,
                inspectedSurvey: payload.data
            }

        case 'selectedService':
            return {
                ...state,
                selectedService: payload
            };

        case 'totalSyncedSurvey':
            return {
                ...state,
                totalSyncedSurvey: payload
            };

        case 'updateOfflineSurveyCount':
            return {
                ...state,
                updateOfflineSurveyCount: payload
            }
        
        case 'serverSyncedSurveyCount':
            return {
                ...state,
                serverSyncedSurveyCount: payload
            }
            
        
        case 'setSiteId':
            return {
                ...state,
                siteId: payload.siteId,
                sTypeId: payload.sTypeId
            }
        
        case 'setInspectionStartDateTime':
            return {
                ...state,
                inspectionStartTiming: payload.inspectionStartTiming
            }
        
        case 'setQuestions':
            return {
                ...state,
                questions: payload.data
            }
            
        
        case 'setInspection':
            return {
                ...state,
                inspection: payload.data
            }
            
        
        case 'setUserCategoryQuestions':
            return {
                ...state,
                userCategoryQuestions: payload.data
            }
        
        case 'setSelectedSite':
            return {
                ...state,
                siteData: payload.data
            }

        default:
            return state;
    }
};
