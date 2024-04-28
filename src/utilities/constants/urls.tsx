let urls = {
    domain: 'hAslerRPpexy4JMcD2dh2pFCALUHD9ehJaCHFcQ0bTY+mpxOKUz3l7wwMZUN90m6',
    mainDomain: 'hAslerRPpexy4JMcD2dh2pFCALUHD9ehJaCHFcQ0bTY+mpxOKUz3l7wwMZUN90m6',
    api_prefix: 'api/',
    register: 'mobile/version',
    login: 'auth/authenticate',
    register_face: 'auth/registerfacial',
    layout: 'system/layout',
    site_type: 'mobile/sitetype/all',
    site_all: 'mobile/site/all',
    question_category: 'mobile/questioncategory',
    reasons: 'mobile/reasons',
    user_category: 'mobile/inspections/user/category',
    inspections: 'mobile/inspections/all',
    mobile_data: 'mobile/data',
    token_info: 'system/tokeninfo',
    mobile_response: 'mobile/response',
    log_create: 'log/create',
    master_all: 'mobile/master/all',
    email: 'inspection/emailrequest',
    voucher_all: 'voucher/all',
    voucher_heads_all: 'voucher/heads/all',
    voucher_create: 'voucher/create',
    incidents_all: 'incident/all',
    evidence_upload: 'mobile/response/upload',
    log_upload: 'log/upload',
    certs: 'auth/cerkey',
    refresh_token: 'auth/refreshtoken'
};

let setDomain = (value: string) => {
    urls.domain = value;
}
// yd5oClkBEN06A60qv/oOQMpi9oB9j8hTNy0mrfZhzWfYWttSROcZSlB2Y0cKDNdt
// factt-digicube: 'TTH3mCUoEjf9GO9Eb0NHUlSNhuFFJlN7nXAPEQ6e5v92pkuA58xXXC6uF6QNLhUx'
// auhnatechlab: '1wndB/ruBfWponQGeBSXcI1rNpIwatfARileUxJGYgqLZztH20ArXxdtSdJUcSki',
// demo-factt: hAslerRPpexy4JMcD2dh2pFCALUHD9ehJaCHFcQ0bTY+mpxOKUz3l7wwMZUN90m6

export { urls, setDomain };