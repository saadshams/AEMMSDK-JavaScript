var assert = require('assert');
var AEMM = require('../../../lib/aemm');
var notification = new AEMM.Notification();
var tenantId = '192a7f47-84c1-445e-a615-ff82d92e2eaa';

before(function(done){
    AEMM.authentication.requestToken(null)
        .then(function(){done()})
        .catch(console.error);
});

describe('Notification', function(){

    it('should be instantiated', function () {
        assert.ok(notification, 'constructor test');
    });

    it('should requestList', function(done){
        // historyFromDate=1471553586000&historySize=40&historyToDate=1472849586000
        var data = {schema: {tenantId: tenantId}};
        notification.requestList(data)
            .then(function(result){
                done();
            }).catch(console.error);
    });

    // it('should delete', function(done){ // delete is not application
    //     var data = {schema: {tenantId: tenantId}};
    //     notification.requestList(data)
    //         .then(function(result){
    //             Promise.all(result.map(function(item){
    //                 return notification.delete({schema: item});
    //             })).then(function(result){
    //                 done();
    //             }).catch(console.error);
    //         })
    // });

    it('should post', function(done){
        this.timeout(0);
        var data = {
            schema: {
                message: 'hello lorenzo your event is scheduled for 9:00 am at room 400',
                tenantId: tenantId,
                schedule: new Date().getTime(),
                timezoneId: null,
                operatingSystemSpecifier: 'ios',
                iosData: {bundleId: 'com.mirumagency.aemmsdk', isProduction: false},
                customData: {deepLink: {collection: 'deepLinkHome', article: ''}},
                omnitureData: {reportSuiteId: 'ap.or.04.aemmsdk', publicationTitle: 'aemmsdk', applicationId: tenantId}
            }
        };
        notification.create(data)
            .then(function(result){
                done();
            }).catch(console.error);
    });

    it('should check health', function(done){
        var data = {schema: {tenantId: tenantId}};
        notification.healthCheck(data)
            .then(function(result){
                done();
            }).catch(console.error);
    });

    it('should count device', function(done){
        var data = {schema: {os: 'ios', appId: 'com.mirumagency.aemmsdk', query: '?iOSIsProduction=false', tenantId: tenantId}};
        notification.deviceCount(data)
            .then(function(result){
                done();
            }).catch(console.error);
    });

});