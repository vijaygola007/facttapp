/* eslint-disable arrow-body-style */
import { actionTypes } from '../../utilities/constants';

const checkIfLoggedIn = () => ({
    type: actionTypes.CHECKED_IF_LOGGED_IN
});

const makeLogin = (data) => {
    return ({
        type: actionTypes.LOGIN_REQUESTED,
        payload: data
    });
};


const userData = (data) => {
    return ({
        type: actionTypes.USER_DATA,
        payload: data
    });
};
const basePath = (data) => {
    return ({
        type: 'basePath',
        payload: data
    });
};

const colorLayout = (data) => {
    return ({
        type: 'COLOR_LAYOUT',
        payload: data
    })
}


const allSiteType = (data) => {
    return ({
        type: 'All_SITE_TYPE',
        payload: data
    })
}

const allSites = (data) => {
    return ({
        type: 'All_SITES',
        payload: data
    })
}

const inspectedSurvey = (data) => {
    return ({
        type: 'INSPECTED_SURVEY',
        payload: data
    })
}


const selectedService = (data) => {
    return ({
        type: 'selectedService',
        payload: data
    });
};

const totalSyncedSurvey = (data) => {
    return ({
        type: 'totalSyncedSurvey',
        payload: data
    });
};

const updateOfflineSurveyCount = (data) => {
    return ({
        type: 'updateOfflineSurveyCount',
        payload: data
    });
};

const serverSyncedSurveyCount = (data) => {
    return ({
        type: 'serverSyncedSurveyCount',
        payload: data
    });
}

const setSiteId = (data) => {
    return ({
        type: 'setSiteId',
        payload: data
    });
}

const setInspectionStartDateTime = (data) => {
    return ({
        type: 'setInspectionStartDateTime',
        payload: data
    });
}

const setQuestions = (data) => {
    return ({
        type: 'setQuestions',
        payload: data
    });
}

const setInspection = (data) => {
    return ({
        type: 'setInspection',
        payload: data
    });
}

const setUserCategoryQuestions = (data) => {
    return ({
        type: 'setUserCategoryQuestions',
        payload: data
    });
}

const setSelectedSite = (data) => {
    return ({
        type: 'setSelectedSite',
        payload: data
    });
}

export {
    checkIfLoggedIn,
    // login,
    makeLogin,
    userData,

    colorLayout,
    allSites,
    allSiteType,
    inspectedSurvey,

    selectedService,
    totalSyncedSurvey,
    updateOfflineSurveyCount,
    serverSyncedSurveyCount,

    basePath,
    setSiteId,
    setInspectionStartDateTime,
    setQuestions,
    setInspection,
    setUserCategoryQuestions,
    setSelectedSite
};
