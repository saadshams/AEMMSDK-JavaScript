var assert = require('assert');
var AEMM = require('../../../lib/aemm');
var certificate = new AEMM.Certificate();
var tenantId = '192a7f47-84c1-445e-a615-ff82d92e2eaa';
var path = require('path');

before(function(done){
    AEMM.authentication.requestToken(null)
        .then(function(){done()})
        .catch(console.error);
});

describe('Certificate', function(){
    var data = {schema: {entityType: AEMM.Entity.TYPE, tenantId: tenantId}};

    it('should be instantiated', function () {
        assert.ok(certificate, 'constructor test');
    });

    it('should requestList', function(done){
        certificate.requestList(data)
            .then(function(result){
                done();
            }).catch(console.error);
    });

    it('should requestMetadata', function(done){
        this.timeout(0);
        certificate.requestList(data)
            .then(function(result){
                return Promise.all(result.appleCertificate.map(function(item){
                    item.os = 'ios';
                    return certificate.requestMetadata(item);
                }));
            })
            .then(function(result){
                assert.equal(result[0].error, 0);
                done();
            })
            .catch(console.error);
    });

    it('should check for revoked certificate', function(done){
        var data = {schema: {os: 'ios', appId: 'com.mirumagency.aemmsdk', tenantId: tenantId}};
        certificate.isRevoked(data)
            .then(function(result){
                done();
            }).catch(console.error);
    });

    it('should upload certificate', function(done){
        this.timeout(0);
        var data = {
            schema: {
                os: 'ios',
                iOSProductionCertificateFile: path.join(__dirname, '../../resources/certificates/AEMMSDK_APNS.p12'),
                iOSSandboxCertificateFile: path.join(__dirname, '../../resources/certificates/AEMMSDK_APNSDev.p12'),
                iOSProductionCertificatePassword: "casamiami",
                iOSSandboxCertificatePassword: "casamiami",
                iOSBundleId: "com.mirumagency.aemmsdk",
                tenantId: tenantId
            }
        };
        certificate.uploadCertificate(data)
            .then(function(result){
                assert.ok(result.uploadSucceeded);
                assert.equal(result.certificateErrorList, null);
                done();
            })
            .catch(console.error);
    });
});