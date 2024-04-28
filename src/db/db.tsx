import SQLite from "react-native-sqlite-2";


import { MONTH_INDEX } from '../utilities/constants';

export const site_type_tbl = 'site_type_tbl';
export const site_tbl = 'site_tbl';
export const question_category_tbl = 'question_category_tbl';
export const reasons_tbl = 'reasons_tbl';
export const user_category_tbl = 'user_category_tbl';
export const inspections_tbl = 'inspections_tbl';
export const mobile_data_tbl = 'mobile_data_tbl';
export const mobile_data_tbl_2 = 'mobile_data_tbl_2';
export const category_tbl = 'category_tbl';
export const file_tbl = 'file_tbl';
export const survey_tbl = 'completed_survey_tbl';
export const inspected_survey_tbl = 'inspected_survey_tbl';
export const unsynced_data_tbl = 'unsynced_data_tbl';
export const draft_tbl = 'draft_tbl';

const connection = SQLite.openDatabase({name: 'auhnatechlab.FACTT.db', location: 'default'}, () => {
    console.log('database connected successfully');
}, (err: any) => {
    
});

const DROP_TABLE_DATA = async () => {
    await runQuery(`DROP TABLE IF EXISTS ${site_type_tbl}`);
    await runQuery(`DROP TABLE IF EXISTS ${site_tbl}`);
    await runQuery(`DROP TABLE IF EXISTS ${question_category_tbl}`);
    await runQuery(`DROP TABLE IF EXISTS ${reasons_tbl}`);
    await runQuery(`DROP TABLE IF EXISTS ${user_category_tbl}`);
    await runQuery(`DROP TABLE IF EXISTS ${inspections_tbl}`);
    await runQuery(`DROP TABLE IF EXISTS ${mobile_data_tbl}`);
    await runQuery(`DROP TABLE IF EXISTS ${mobile_data_tbl_2}`);
    await runQuery(`DROP TABLE IF EXISTS ${category_tbl}`);
    await runQuery(`DROP TABLE IF EXISTS ${unsynced_data_tbl}`);
    await runQuery(`DROP TABLE IF EXISTS ${draft_tbl}`);
}

const DELETE_TABLE_DATA = async () => {
    await runQuery(`DELETE from ${site_type_tbl}`);
    await runQuery(`DELETE from ${site_tbl}`);
    await runQuery(`DELETE from ${question_category_tbl}`);
    await runQuery(`DELETE from ${reasons_tbl}`);
    await runQuery(`DELETE from ${user_category_tbl}`);
    await runQuery(`DELETE from ${inspections_tbl}`);
    await runQuery(`DELETE from ${mobile_data_tbl}`);
    await runQuery(`DELETE from ${mobile_data_tbl_2}`);
    await runQuery(`DELETE from ${category_tbl}`);
    await runQuery(`DELETE from ${unsynced_data_tbl}`);
    await runQuery(`DELETE from ${draft_tbl}`);
}

const createInspectedSurveyCategory_TBL = () => {
    connection.transaction((txn: any) => {
        txn.executeSql(
            `CREATE TABLE IF NOT EXISTS ${inspected_survey_tbl} (
                siteID INTEGER, sTypeId INTEGER, qCategoryID INTEGER, inspectionId INTEGER, isSurveySavedToUpload BOOLEAN
            )`,
            []
        );
    },(error: any) => {
        // error callback
    },() => {
        // success callback
    })
};

const insertDraftData_TBL = async (draftList: any) => new Promise((resolve, reject) => {
    connection.transaction((txn: any) => {
        txn.executeSql(
            `CREATE TABLE IF NOT EXISTS ${draft_tbl} (
                draftId VARCHAR, siteId INTEGER, sTypeId INTEGER, inspectionId INTEGER, qCategoryID INTEGER, 
                transactionNo VARCHAR, activeQuestionIndex INTEGER, questions TEXT, createdDate VARCHAR
            )`,
            []
        );

        var date = new Date();
        var hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
        var createdDate = date.getDate()+'/'+MONTH_INDEX[date.getMonth()]+'/'+date.getFullYear()+' '+hours+':'+(date.getMinutes() > 9 ? date.getMinutes() : '0'+date.getMinutes())+' '+(date.getHours() > 12 ? 'PM' : 'AM')

        draftList.forEach((data: object) => {
            txn.executeSql(`INSERT INTO ${draft_tbl} 
            (draftId, siteId, sTypeId, inspectionId, qCategoryID, transactionNo, activeQuestionIndex, questions, createdDate) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [data['draftId'], data['siteId'], data['sTypeId'], data['inspectionId'], data['qCategoryID'], data['transactionNo'], data['activeQuestionIndex'], data['questions'], createdDate],
                (tx: any, results: any) => {
                    // success callback
                    resolve(results);
                },(tx: any, error: any) => {
                    reject(error);
                    // error callback
                }
            )
        });

    },(error: any) => {
        // error callback
        reject(error);
    },() => {
        resolve('success');
        // success callback
    })
});

const insertUnsyncedData_TBL = (data: any) => {
    connection.transaction((txn: any) => {
        txn.executeSql(
            `CREATE TABLE IF NOT EXISTS ${unsynced_data_tbl} (
                userID INTEGER, loginId VARCHAR, regcode VARCHAR, 
                transactionNo VARCHAR, type VARCHAR, error TEXT, data TEXT
            )`,
            []
        );

        txn.executeSql(`INSERT INTO ${unsynced_data_tbl} 
        (userID, transactionNo, type, error, data) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`, 
        [data['userID'], data['loginId'], data['regcode'], data['transactionNo'], data['type'], data['error'], data['data']],
            (tx: any, results: any) => {
                // success callback
            },(tx: any, error: any) => {
                // error callback
            }
        )

    },(error: any) => {
        // error callback
    },() => {
        // success callback
    })
};

const inspectedSurveyCategory_TBL = (data: Array<object>) => {
    connection.transaction((txn: any) => {

        txn.executeSql(
            `CREATE TABLE IF NOT EXISTS ${inspected_survey_tbl} (
                siteID INTEGER, sTypeId INTEGER, qCategoryID INTEGER, inspectionId INTEGER, isSurveySavedToUpload BOOLEAN
            )`,
            []
        );

        data.forEach((d: object) => {
            txn.executeSql(`INSERT INTO ${inspected_survey_tbl} 
            (siteID, sTypeId, qCategoryID, inspectionId, isSurveySavedToUpload) 
            VALUES (?, ?, ?, ?, ?)`, 
            [d['siteID'], d['sTypeId'], d['qCategoryID'], d['inspectionId'], d['isSurveySavedToUpload']],
                (tx: any, results: any) => {
                    // success callback
                },(tx: any, error: any) => {
                    // error callback
                }
            )
        });
        
    },(error: any) => {
        // error callback
    },() => {
        // success callback
    })
};


const insertSiteTypeData_TBL = (data: Array<object>) => {
    runQuery(`DELETE from ${site_type_tbl}`);
    connection.transaction((txn: any) => {
        
        // txn.executeSql(`DROP TABLE IF EXISTS ${site_type_tbl}`, []);
        // txn.executeSql(`DROP TABLE IF EXISTS ${survey_tbl}`, []);
        txn.executeSql(
            `CREATE TABLE IF NOT EXISTS ${file_tbl} (file_path TEXT, file_name TEXT, media_type, trans_no, is_synced BOOLEAN)`,
            []
        );

        txn.executeSql(
            `CREATE TABLE IF NOT EXISTS ${survey_tbl} (
                transactionNo VARCHAR, siteId VARCHAR(255), siteCode VARCHAR(50), siteName VARCHAR(255),
                inspectionId VARCHAR(255), inspectionCode VARCHAR(255), rawData TEXT, 
                responseStartDate VARCHAR(50), responseEndDate VARCHAR(50), gpsCoordinate VARCHAR(255),
                is_synced BOOLEAN
            )`,
            []
        );

        txn.executeSql(
            `CREATE TABLE IF NOT EXISTS ${site_type_tbl} (sTypeID INTEGER PRIMARY KEY,sType VARCHAR(255), icon VARCHAR(255), enable BOOLEAN)`,
            []
        );

        data.forEach((d: object) => {
            txn.executeSql(`INSERT INTO ${site_type_tbl} (sTypeID, sType, icon, enable) VALUES (:sTypeID, :sType, :icon, :enable)`, 
            [d['sTypeID'], d['sType'], d['icon'], d['enable']],
            (tx: any, results: any) => {
                    
            },(tx: any, error: any) => {
                
            });
        });

        // txn.executeSql(`select * from ${site_type_tbl}`, [], function (tx, response) {
        //     var res: Array<object> = [];
        //     for (let i = 0; i < response.rows.length; ++i) {
        //         res.push(response.rows.item(i));
        //     }
        //     if(res.length > 0){
        //         var old_data = data.filter((d: any) => res.map((m: any) => m.sTypeID).includes(d.sTypeID));
        //         var new_data = data.filter((d: any) => !res.map((m: any) => m.sTypeID).includes(d.sTypeID));
        //         old_data.forEach((d: object) => {
        //             txn.executeSql(`UPDATE ${site_type_tbl} 
        //             SET sType = ?, icon = ?, enable = ?
        //             WHERE sTypeID = ?`, 
        //             [d['sType'], d['icon'], d['enable'], d['sTypeID']]
        //             );
        //         });
        //         new_data.forEach((d: object) => {
        //             txn.executeSql(`INSERT INTO ${site_type_tbl} (sTypeID, sType, icon, enable) VALUES (:sTypeID, :sType, :icon, :enable)`, [d['sTypeID'], d['sType'], d['icon'], d['enable']]);
        //         });
        //     }else{
        //         data.forEach((d: object) => {
        //             txn.executeSql(`INSERT INTO ${site_type_tbl} (sTypeID, sType, icon, enable) VALUES (:sTypeID, :sType, :icon, :enable)`, [d['sTypeID'], d['sType'], d['icon'], d['enable']]);
        //         });
        //     }
        // });

    },(error: any) => {
        // error callback
        console.log(error);
    },() => {
        // success callback
    })
};

const insertSiteData_TBL = (data: Array<object>) => {
    
    runQuery(`DELETE from ${site_tbl}`);
    connection.transaction((txn: any) => {
        txn.executeSql(
            `CREATE TABLE IF NOT EXISTS ${site_tbl} (siteID INTEGER PRIMARY KEY NOT NULL,
                siteName VARCHAR(255), icon VARCHAR(255), sType VARCHAR(255),
                siteCode VARCHAR(255), siteLat VARCHAR(255), siteLog VARCHAR(255),
                sTypeId INTEGER, lastAuditedOn VARCHAR(255), siteAddress TEXT, assets TEXT)`,
            []
        );
        // 
        data.forEach((d: object) => {
            txn.executeSql(`INSERT INTO ${site_tbl} 
            (siteID, siteName, icon, sType, siteCode, siteLat, siteLog, sTypeId, lastAuditedOn, siteAddress, assets) 
            VALUES 
            (:siteID, :siteName, :icon, :sType, :siteCode, :siteLat, :siteLog, :sTypeId, :lastAuditedOn, :siteAddress, :assets)`, 
            [d['siteID'], d['siteName'], d['icon'], d['sType'], d['siteCode'], d['siteLat'], d['siteLog'], d['sTypeId'], d['lastAuditedOn'], d['siteAddress'], JSON.stringify(d['assets'])],
            (tx: any, results: any) => {
                
            },(tx: any, error: any) => {
                
            });
        });
    })
};


const insertQuestionCategoryData_TBL = (data: Array<object>) => {

    runQuery(`DELETE from ${question_category_tbl}`);
    connection.transaction((txn: any) => {
        
        // txn.executeSql(`DROP TABLE IF EXISTS ${question_category_tbl}`, []);

        txn.executeSql(
            `CREATE TABLE IF NOT EXISTS ${question_category_tbl} (qCategoryID INTEGER PRIMARY KEY NOT NULL,
                sTypeId INTEGER, displayOrder INTEGER,  enable BOOLEAN,
                qCategoryName VARCHAR(255), incidentMailTo VARCHAR(255), qCategoryCode VARCHAR(255), 
                isSurveyCompleted BOOLEAN, isSurveySynced BOOLEAN)`,
            []
        );

        data.forEach((d: object) => {
            var sql = `INSERT INTO ${question_category_tbl} 
            (qCategoryID, sTypeId, displayOrder, enable, qCategoryName, incidentMailTo, qCategoryCode, isSurveyCompleted, isSurveySynced) 
            VALUES (${d['qCategoryID']},${d['sTypeID']}, ${d['displayOrder']}, ${d['enable']}, '${d['qCategoryName']}',
            '${d['incidentMailTo']}', '${d['qCategoryCode']}', false, false) 
            ON CONFLICT(qCategoryID) DO UPDATE SET sTypeId=${d['sTypeID']}, displayOrder=${d['displayOrder']}, enable=${d['enable']}, 
            qCategoryName='${d['qCategoryName']}', incidentMailTo='${d['incidentMailTo']}', 
            qCategoryCode='${d['qCategoryCode']}'`;

            txn.executeSql(sql, [],
                (tx: any, results: any) => {
                    
                },(tx: any, error: any) => {
                    
                }
            )
        });
    },(error: any) => {
        // error callback
    },() => {
        // success callback
    })
};


const insertInspectionsData_TBL = (data: Array<object>) => {

    runQuery(`DELETE from ${inspections_tbl}`);
    connection.transaction((txn: any) => {
        
        // txn.executeSql(`DROP TABLE IF EXISTS ${inspections_tbl}`, []);

        txn.executeSql(
            `CREATE TABLE IF NOT EXISTS ${inspections_tbl} (inspectionNo VARCHAR(255) PRIMARY KEY NOT NULL,
                inspectionName VARCHAR(255),inspectionCode VARCHAR(255),
                inspectionId VARCHAR(255),inspectionStatus VARCHAR(50),inspectedBy VARCHAR(255),
                inspectedOn VARCHAR(255),siteName VARCHAR(255),siteCode VARCHAR(255))`,
            []
        );

        data.forEach((d: object) => {
            txn.executeSql(`INSERT INTO ${inspections_tbl} 
            (inspectionId,inspectionName,inspectionCode,inspectionNo,inspectionStatus,inspectedBy,inspectedOn,siteName,siteCode) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [d['inspectionId'], d['inspectionName'], d['inspectionCode'], d['inspectionNo'], d['inspectionStatus'], d['inspectedBy'], d['inspectedOn'], d['siteName'], d['siteCode']],
                (tx: any, results: any) => {
                    // success callback
                },(tx: any, error: any) => {
                    // error callback
                }
            )
        });
        // txn.executeSql(`select * from ${inspections_tbl}`, [], function (tx, response) {
        //     var res: Array<object> = [];
        //     for (let i = 0; i < response.rows.length; ++i) {
        //         res.push(response.rows.item(i));
        //     }
        //     if(res.length > 0){
        //         var old_data = data.filter((d: any) => res.map((m: any) => m.reasonID).includes(d.reasonID));
        //         var new_data = data.filter((d: any) => !res.map((m: any) => m.reasonID).includes(d.reasonID));
        //         old_data.forEach((d: object) => {
        //             txn.executeSql(`UPDATE ${inspections_tbl} 
        //             SET  inspectionName = ?,inspectionCode = ?,inspectionId = ?,inspectionStatus = ?,inspectedBy = ?,inspectedOn = ?,siteName = ?,siteCode = ?
        //             WHERE inspectionNo = ?`, 
        //             [d['inspectionName'], d['inspectionCode'], d['inspectionId'], d['inspectionStatus'], d['inspectedBy'], d['inspectedOn'], d['siteName'], d['siteCode'], d['inspectionNo']]
        //             );
        //         });
        //         new_data.forEach((d: object) => {
        //             txn.executeSql(`INSERT INTO ${inspections_tbl} 
        //             (inspectionId,inspectionName,inspectionCode,inspectionNo,inspectionStatus,inspectedBy,inspectedOn,siteName,siteCode) 
        //             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        //             [d['inspectionId'], d['inspectionName'], d['inspectionCode'], d['inspectionNo'], d['inspectionStatus'], d['inspectedBy'], d['inspectedOn'], d['siteName'], d['siteCode']],
        //                 (tx: any, results: any) => {
        //                     // success callback
        //                 },(tx: any, error: any) => {
        //                     // error callback
        //                 }
        //             )
        //         });
        //     }else{
        //         data.forEach((d: object) => {
        //             txn.executeSql(`INSERT INTO ${inspections_tbl} 
        //             (inspectionId,inspectionName,inspectionCode,inspectionNo,inspectionStatus,inspectedBy,inspectedOn,siteName,siteCode) 
        //             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        //             [d['inspectionId'], d['inspectionName'], d['inspectionCode'], d['inspectionNo'], d['inspectionStatus'], d['inspectedBy'], d['inspectedOn'], d['siteName'], d['siteCode']],
        //                 (tx: any, results: any) => {
        //                     // success callback
        //                 },(tx: any, error: any) => {
        //                     // error callback
        //                 }
        //             )
        //         });
        //     }
        // });
        

    },(error: any) => {
        // error callback
    },() => {
        // success callback
    })
};


const insertReasonsData_TBL = (data: Array<object>) => {

    runQuery(`DELETE from ${reasons_tbl}`);
    connection.transaction((txn: any) => {
        
        // txn.executeSql(`DROP TABLE IF EXISTS ${reasons_tbl}`, []);

        txn.executeSql(
            `CREATE TABLE IF NOT EXISTS ${reasons_tbl} (reasonID INTEGER PRIMARY KEY NOT NULL,
                reasonText VARCHAR(255), tags VARCHAR(255),qCategoryId INTEGER,
                enable BOOLEAN)`,
            []
        );

        data.forEach((d: object) => {
            txn.executeSql(`INSERT INTO ${reasons_tbl} 
            (reasonID, reasonText, tags, qCategoryId, enable) 
            VALUES (?, ?, ?, ?, ?)`, 
            [d['reasonID'], d['reasonText'], d['tags'], d['qCategoryId'], d['enable']],
                (tx: any, results: any) => {
                    // success callback
                },(tx: any, error: any) => {
                    // error callback
                }
            )
        });
        // txn.executeSql(`select * from ${reasons_tbl}`, [], function (tx, response) {
        //     var res: Array<object> = [];
        //     for (let i = 0; i < response.rows.length; ++i) {
        //         res.push(response.rows.item(i));
        //     }
        //     if(res.length > 0){
        //         var old_data = data.filter((d: any) => res.map((m: any) => m.reasonID).includes(d.reasonID));
        //         var new_data = data.filter((d: any) => !res.map((m: any) => m.reasonID).includes(d.reasonID));
        //         old_data.forEach((d: object) => {
        //             txn.executeSql(`UPDATE ${reasons_tbl} 
        //             SET qCategoryId = ?, enable = ?, reasonText = ?, tags = ?
        //             WHERE reasonID = ?`, 
        //             [d['qCategoryId'], d['enable'], d['reasonText'], d['tags'], d['reasonID']]
        //             );
        //         });
        //         new_data.forEach((d: object) => {
        //             txn.executeSql(`INSERT INTO ${reasons_tbl} 
        //             (reasonID, reasonText, tags, qCategoryId, enable) 
        //             VALUES (?, ?, ?, ?, ?)`, 
        //             [d['reasonID'], d['reasonText'], d['tags'], d['qCategoryId'], d['enable']],
        //                 (tx: any, results: any) => {
        //                     // success callback
        //                 },(tx: any, error: any) => {
        //                     // error callback
        //                 }
        //             )
        //         });
        //     }else{
        //         data.forEach((d: object) => {
        //             txn.executeSql(`INSERT INTO ${reasons_tbl} 
        //             (reasonID, reasonText, tags, qCategoryId, enable) 
        //             VALUES (?, ?, ?, ?, ?)`, 
        //             [d['reasonID'], d['reasonText'], d['tags'], d['qCategoryId'], d['enable']],
        //                 (tx: any, results: any) => {
        //                     // success callback
        //                 },(tx: any, error: any) => {
        //                     // error callback
        //                 }
        //             )
        //         });
        //     }
        // });
        
    },(error: any) => {
        // error callback
    },() => {
        // success callback
    })
};

const insertAllMobileData_TBL = (data: Array<object>) => {
    runQuery(`DELETE from ${mobile_data_tbl}`);
    connection.transaction((txn: any) => {
        
        txn.executeSql(
            `CREATE TABLE IF NOT EXISTS ${mobile_data_tbl} (inspectionId INTEGER PRIMARY KEY NOT NULL,
                scode VARCHAR(255), sname VARCHAR(255),stypeId INTEGER,
                stype VARCHAR(255), question TEXT)`,
            []
        );
        // data.forEach((d: object) => {
        //     var sql = `INSERT INTO ${mobile_data_tbl} 
        //     (inspectionId, scode, sname, stypeId, stype, question) 
        //     VALUES (${d['inspectionId']},'${d['scode']}', '${d['sname']}', ${d['stypeId']}, '${d['stype']}',
        //     '${JSON.stringify(d['question'])}') ON CONFLICT(inspectionId) DO UPDATE SET 
        //     scode='${d['scode']}', sname='${d['sname']}', stypeId=${d['stypeId']}, 
        //     stype='${d['stype']}', question='${JSON.stringify(d['question'])}'`;

        //     console.log(sql);

        //     txn.executeSql(sql, [],
        //         (tx: any, results: any) => {
        //             console.log(results);
        //         },(tx: any, error: any) => {
        //             console.log(error);
        //         }
        //     )
        // });
        data.forEach((d: object) => {
            txn.executeSql(`INSERT INTO ${mobile_data_tbl} 
            (inspectionId, scode, sname, stypeId, stype, question) 
            VALUES (?, ?, ?, ?, ?, ?)`, 
            [d['inspectionId'], d['scode'], d['sname'], d['stypeId'], d['stype'], JSON.stringify(d['question'])],
                (tx: any, results: any) => {
                    
                },(tx: any, error: any) => {
                    
                }
            )
        });

    })
}


const insertUserCategoryData_TBL = (data: Array<object>) => {

    runQuery(`DELETE from ${user_category_tbl}`);
    connection.transaction((txn: any) => {
        
        txn.executeSql(`DROP TABLE IF EXISTS ${user_category_tbl}`, []);

        txn.executeSql(
            `CREATE TABLE ${user_category_tbl} (user_category TEXT)`,
            []
        );
        
        txn.executeSql(`INSERT INTO ${user_category_tbl} (user_category) VALUES (?)`, 
        [JSON.stringify(data)],
            (tx: any, results: any) => {
                // success callback
            },(tx: any, error: any) => {
                // error callback
            }
        )

    },(error: any) => {
        // error callback
    },() => {
        // success callback
    })
};


const insertFileData_TBL = (data: Array<object>) => {

    connection.transaction((txn: any) => {
            
        data.forEach((d: object) => {
            txn.executeSql(`INSERT INTO ${file_tbl} 
            (file_path, file_name, media_type, trans_no, is_synced) 
            VALUES (?, ?, ?, ?, ?)`, 
            [d['file_path'], d['file_name'], d['media_type'], d['trans_no'], false],
                (tx: any, results: any) => {
                    // success callback
                },(tx: any, error: any) => {
                    // error callback
                }
            )
        });

    },(error: any) => {
        // error callback
    },() => {
        // success callback
    })
};

const saveSurveyData_TBL = (data: Array<object>) => {

    connection.transaction((txn: any) => {


        txn.executeSql(
            `CREATE TABLE IF NOT EXISTS ${survey_tbl} (
                transactionNo VARCHAR, siteId VARCHAR(255), siteCode VARCHAR(50), siteName VARCHAR(255),
                inspectionId VARCHAR(255), inspectionCode VARCHAR(255), rawData TEXT, 
                responseStartDate VARCHAR(50), responseEndDate VARCHAR(50), gpsCoordinate VARCHAR(255),
                is_synced BOOLEAN
            )`,
            []
        );
        
        data.forEach((d: object) => {
            txn.executeSql(`INSERT INTO ${survey_tbl} 
            (transactionNo , siteId , siteCode, siteName,
            inspectionId, inspectionCode, rawData, 
            responseStartDate, responseEndDate, gpsCoordinate, is_synced) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [d['transactionNo'], d['siteId'], d['siteCode'], d['siteName'], d['inspectionId'], 
            d['inspectionCode'], d['rawData'], d['responseStartDate'], d['responseEndDate'], d['gpsCoordinate'],false],
                (tx: any, results: any) => {
                    // success callback
                    console.log('completed');
                },(tx: any, error: any) => {
                    // error callback
                }
            )
        });

    },(error: any) => {
        // error callback
    },() => {
        // success callback
    })
};

const updateSurveyData_TBL = (rawData, responseEndDate, transactionNo) => {

    connection.transaction((txn: any) => {
        txn.executeSql(`UPDATE ${survey_tbl} SET rawData = ?, responseEndDate = ? WHERE transactionNo = ?`, [rawData, responseEndDate, transactionNo])
    },(error: any) => {
        // error callback
    },() => {
        // success callback
    })
};

const getData = async () => new Promise((resolve, reject) => {
    connection.transaction((txn: any) => {
        txn.executeSql(`SELECT * FROM ${site_type_tbl}`, [], function (tx, res) {
            var data: any = [];
            for (let i = 0; i < res.rows.length; ++i) {
                data.push(res.rows.item(i));
            }
            resolve(data);
        });
    })
});

const runQuery = async (sql: string) => new Promise((resolve, reject) => {
    connection.transaction((txn: any) => {
        txn.executeSql(sql, [], function (tx, res) {
            var data: Array<object> = [];
            for (let i = 0; i < res.rows.length; ++i) {
                data.push(res.rows.item(i));
            }
            resolve(data as Array<object>);
        });
    }, (error) => {
        reject([]);
    })
})


export {
    insertSiteTypeData_TBL,
    insertSiteData_TBL,
    insertQuestionCategoryData_TBL,
    insertReasonsData_TBL,
    insertInspectionsData_TBL,
    insertAllMobileData_TBL,
    insertUserCategoryData_TBL,
    insertFileData_TBL,
    saveSurveyData_TBL,
    getData,
    runQuery,
    DROP_TABLE_DATA,
    DELETE_TABLE_DATA,
    updateSurveyData_TBL,
    inspectedSurveyCategory_TBL,
    createInspectedSurveyCategory_TBL,
    insertUnsyncedData_TBL,
    insertDraftData_TBL
}
