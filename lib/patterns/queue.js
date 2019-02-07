var AEMM = require('../aemm');

function Queue(asyncfunc) {
    this.jobs = [];
    this.iterator = new AEMM.Iterator(asyncfunc);
}

Queue.prototype.push = function(data) {
    var self = this;
    return new Promise(function(resolve, reject){
        self.jobs.push({data: data, resolve: resolve, reject: reject});
        if(!self.inProgress) {
            self.inProgress = true;
            self.run();
        }
    });
};

Queue.prototype.run = function() {
    var self = this;
    var data = {entities: [], schema: {publicationId: this.jobs[0].data.schema.publicationId}};
    for(var i=0; i<this.jobs.length; i++) {
        data.entities.push({href: '/publication/' + this.jobs[i].data.schema.publicationId + '/' + this.jobs[i].data.schema.entityType + '/' + this.jobs[i].data.schema.entityName + ';version=' + this.jobs[i].data.schema.version});
    }
    this.iterator.next(data)
        .then(AEMM.Entity.prototype.addWorkflowObserver)
        .then(function(data){
            for(var i=0; i<data.entities.length; i++) {
                var temp = self.jobs.shift();
                temp.resolve(temp.data);
            }
            self.next();
        })
        .catch(function(error) {
            switch(error.code) {
                case 'PublicationLockedException':
                    setTimeout(self.next.bind(self), 5000);
                    break;
                default:
                    var matches = AEMM.matchUrl(error.message.match(/\/publication([^\s]*)/)[0]);
                    for(var i=0; i<data.entities.length; i++) {
                        if(self.jobs[i].data.schema.entityName === matches[4]) {
                            var temp = self.jobs.splice(i, 1)[0];
                            temp.reject(error);
                            break;
                        }
                    }
                    self.next();
                    break;
            }
        });
};

Queue.prototype.next = function(){
    if(this.jobs.length) {
        this.run();
    } else {
        this.inProgress = false;
    }
};

Queue.prototype.iterator;

Queue.prototype.jobs;

Queue.prototype.inProgress = false;

AEMM.Queue = Queue;