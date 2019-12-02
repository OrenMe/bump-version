app.controller( 'editTicketsController', [ '$scope', '$location', '$timeout', 'GitHub', 'Jira',
    function ( $scope, $location, $timeout, GitHub, Jira ) {

        $scope.btnTxt = "Edit";
        $scope.inEditProcess = false;
        $scope.status = 'Ready For QA';
        $scope.qa = 'Tzachi Guetta';
        $scope.assignees = [{
            id: 1,
            name: 'Tzachi Guetta',
            key: 'tzachi'
          }, {
            id: 2,
            name: 'Ilanit Shohat',
            key: 'Ilanit Shohat'
          }, {
            id: 3,
            name: 'Alex Greenfeld',
            key: 'alexg'
          }];
          $scope.selectedAssignee = $scope.assignees[1];
        var tickets_array = null;

        (function () {
            var releaseInfo = {
                prerelease: $scope.global.prerelease,
                lastOfficialVersion: $scope.global.lastOfficialVersion
            };
            GitHub.getNewReleaseCommitsSplitted( releaseInfo )
                .then( function ( commits ) {
                    tickets_array = commits.withJiraTicket;
                    $scope.tickets = tickets_array.join();
                } )
                .catch( function ( e ) {
                } )
                .finally( function () {
                    $scope.loadingPage = false;
                } );
        })();
        $scope.update = function(opt){
            $scope.selectedAssignee = opt;
            console.log(opt.name)
        }
        $scope.onEditClicked = function () {
            if ( $scope.btnTxt === "Edit" ) {
                $scope.btnTxt = "Editing...";
                $scope.inTagProcess = true;
                Jira.changeAssignee( $scope.selectedAssignee.key, tickets_array )
                    .then( function () {
                        Jira.changeStatuses( tickets_array )
                    } )
                    .then( function () {
                        $scope.btnTxt = "Finish";
                    } )
                    .catch( function ( e ) {
                        $scope.btnTxt = "Close";
                        $scope.errMsg = e.data.message;
                    } )
                    .finally( function () {
                        $scope.inEditProcess = false;
                    } );
            } else {
                window.close();
            }
        };

        $scope.finish = function () {
            window.close();
        };

        $scope.back = function () {
            $location.path( '/release-notes-github' );
        };
    } ] );