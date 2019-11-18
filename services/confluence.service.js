app.service('Confluence', ['$http', '$q', function ($http, $q) {

    const _apiPrefix = "https://kaltura.atlassian.net/wiki/rest/api";
    const _space = "FEC";
    const _playerV2PageID = "51119129";
    const _playerV2MainVersionPageId = 51119129;
    const _playerV2TemplatePageID = 1286340633;
    const _pageIndexTemplate = '<p><ac:structured-macro ac:name=\"pagetree\" ac:schema-version=\"1\" ac:macro-id=\"70c503a3-035c-4bc2-8949-1e609ded2d73\"><ac:parameter ac:name=\"root\"><ac:link><ri:page ri:content-title=\"@self\" /></ac:link></ac:parameter></ac:structured-macro></p>';
    const _sr = StorageRepresentation.getInstance();

    this.createPage = function (pageData) {
        const deferred = $q.defer();
        Promise.all([
            fetch(`${_apiPrefix}/content/${_playerV2TemplatePageID}?expand=body.storage`),
            fetch(_apiPrefix + "/user/current"),
            _getDirectParentPage(pageData.newVersion)
          ])
          .then(async([contentResponse, userResponse, directParent]) => {
            const content = await contentResponse.json();
            const user = await userResponse.json();
            const withOutJiraTicket = '<ul>' + pageData.issues.withOutJiraTicket.forEach(issue => {
                return `<li>${issue}</li>`
            }) + '</ul>';
            const page = content.body.storage.value.replace('${VERSION}', pageData.newVersion)
            .replace('datetime=\"2019-11-18\"', 'datetime=\"'+moment().format('YYYY-MM-DD')+'\"')
            .replace(new RegExp('http://LIB_TEST_URL', 'g'), pageData.libTestUrl)
            .replace(new RegExp('http://GITHUB_URL', 'g'), pageData.githubUrl)
            .replace('ff8080814539ad6a01454066cdfe0003', user.userKey)
            .replace('FEC-1234', pageData.issues.withJiraTicket.join())
            .replace('${ISSUE_PLACE_HOLDER}', withOutJiraTicket)
            .replace('${IMPORTANT_TO_KNOW}', pageData.importantToKnow)
            .replace('${KNOWN_ISSUES}', pageData.knownIssues)
            .replace('${PRE_SANITY_TESTS}', pageData.preSanityTests);
            return _createPage(directParent, page, pageData.title).then((res) => {
                deferred.resolve(res);
            });
        })
        return deferred.promise;
    };
    
    function _getCurrentUser() {
        var deferred = $q.defer();

        $http.get(_apiPrefix + "/user/current")
            .then(function (response) {
                deferred.resolve(response.data);
            })
            .catch(function (e) {
                deferred.reject(e);
            });

        return deferred.promise;
    }

    function _getDirectParentPage(version, start = 0, limit = 25) {
        const deferred = $q.defer();
        function getPos(str, subStr, i) {
            return str.split(subStr, i).join(subStr).length; 
        }
        const lookForVersion = "v" + version.substr(0, getPos(version, '.', 2));

        fetch(_apiPrefix + "/content/" + _playerV2PageID + "/child/page?expand=page" +
            "&start=" + start + "&limit=" + limit)
            .then(async function (response) {
                const res = await response.json();
                const children = res.results;
                if (!children.length) {
                    return _createVersionIndexPage(lookForVersion).then((page) => {
                        deferred.resolve(page);
                    }).catch(() => {
                        deferred.resolve(null);
                    })
                }
                for (var i = 0; i < children.length; i++) {
                    const child = children[i];
                    if (lookForVersion === child.title) {
                        return deferred.resolve(child);
                    }
                }
                _getDirectParentPage(version, limit, limit + 25).then((child) => {
                    deferred.resolve(child);
                });
            })
            .catch(function (e) {
                deferred.reject(e);
            });

        return deferred.promise;
    }

    function _createVersionIndexPage(title) {
        
        const deferred = $q.defer();

        const payload = JSON.stringify({
            "type": "page",
            "ancestors": [{
                "id": _playerV2MainVersionPageId
            }],
            "title": title,
            "space": {
                "key": _space
            },
            "body": {
                "storage": {
                    "value": _pageIndexTemplate,
                    "representation": "storage"
                }
            }
        });
        fetch(_apiPrefix + "/content", {
            method: "post",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: payload
        }).then(async function(response) {
            const res = await response.json();
            deferred.resolve(res);
        }).catch(e => {
            deferred.reject(e);
        });

        return deferred.promise;
    }

    function _createPage(directParent, pageData, title) {
        const deferred = $q.defer();

        const payload = JSON.stringify({
            "type": "page",
            "ancestors": [{
                "id": directParent.id
            }],
            "title": title,
            "space": {
                "key": _space
            },
            "body": {
                "storage": {
                    "value": pageData,
                    "representation": "storage"
                }
            }
        });

        fetch(_apiPrefix + "/content", {
            method: "post",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: payload
        }).then(async function (response) {
            const res = await response.json();
            deferred.resolve(res);
        }).catch(function (e) {
            deferred.reject(e);
        });

        return deferred.promise;
    }
}]);

