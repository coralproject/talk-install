var Store = {
  get: function(key) {
    var value = localStorage.getItem(key);

    if (value) {
      try {
        value = JSON.parse(value);
      } catch (e) {

        // remove the item, it wasn't json...
        Store.remove(key);

        value = null;
      }
    }

    return value;
  },
  remove: function(key) {
    localStorage.removeItem(key);
  },
  set: function(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// Update the modal progress.
function updateProgress(text, hide) {
  console.log(text);

  $('#deploy-progress p').text(text);

  if (hide) {
    $('#deploy-progress div').hide();
  } else {
    $('#deploy-progress div').show();
  }
}

function failed(err) {
  console.error(err);

  var text = '';

  if (typeof err === 'string') {
    text = err;
  } else if (err.message) {
    text = err.message;
  } else if ('responseJSON' in err &&
             'error' in err.responseJSON &&
             'body' in err.responseJSON.error &&
             'message' in err.responseJSON.error.body) {
    text = err.responseJSON.error.body.message;
  } else {
    text = err;
  }

  $("#errors .error-content").text(text);
  $("#errors").show();
  $('#deployment-modal').modal('close');

  if (err.detail) {
    $('#errors .error-detail').text(err.detail);
    $('#errors .error-detail').show();
  }
}

function loadLatestRelease() {
  $.ajax({
    cache: true,
    method: 'GET',
    url: '/api/github/releases/latest',
  })
  .then(function(release) {
    $('#latest-release').text(release.tag_name);
    $('#tarball-input').val(release.tarball_url);
    $('#version-input').val(release.tag_name);
    $('#latest-release-notes').html('Latest ' + (release.prerelease ? 'prerelease' : 'stable release') + ' of Talk is <a href="' + release.html_url + '" target="_blank">' + release.tag_name + '</a>');

    $('#tag-spinner').fadeOut(function() {
      $('#deploy-button-gutter').fadeIn();
    });
  })
  .fail(function(err) {
    failed('Can\'t load the most recent release of Talk.');
  });
}

function attachToForm() {

  // Attach to the form on tha page so when we submit it, we can actually do
  // some rendering.
  $('form').validate({
    errorClass: 'invalid',
    errorPlacement: function(error, element) {
      element.next("label").attr("data-error", error.contents().text());
    },
    submitHandler: function(form, e) {

      // Prevent the form from submitting.
      e.preventDefault();

      // Serialize the data.
      var data = $(form).serialize();

      // Start the deploy.
      startDeploy(data);
    }
  });
}

function startDeploy(data) {
  $('#deploy-button').prop('disabled', true);
  $('#deploy-button').addClass('disabled');

  $('#deployment-modal').modal('open');

  $('#deploy-progress').show();

  updateProgress('Starting deployment');

  deploy(data);
}

function deploy(data) {
  $.ajax({
    method: 'POST',
    url: '/api/heroku/app-setups',
    data: data
  }).done(function(appSetup) {

    updateProgress('Deployment started');

    console.log('Deployment started with id ' + appSetup.id);

    setTimeout(pollDeployment(appSetup, false), 3000);
  })
  .fail(function(err) {
    updateProgress('Deployment failed', true);

    failed(err);
  });
}

function tailDeploymentProgress(appSetup) {
  var pre = $("#deploy-progress pre");
  var buildOutput = '';

  var xhr = new XMLHttpRequest();
  xhr.open("GET", appSetup.build.output_stream_url, true);
  xhr.onprogress = function() {
    if (buildOutput === '') {
      pre.show();
    }

    buildOutput += xhr.responseText;

    pre.text(buildOutput);
    pre.scrollTop(pre.prop('scrollHeight'));
  };
  xhr.send();
}

function pollDeployment(appSetup, buildStarted) {
  return function() {
    $.ajax({
      method: 'GET',
      dataType: 'json',
      contentType: 'application/json',
      url: '/api/heroku/app-setups/' + appSetup.id
    }).done(function(appSetup) {

      // Once the build is non null and the build hasn't been marked as started
      // then tail the deployment progress.
      if (!buildStarted && appSetup.build) {
        tailDeploymentProgress(appSetup);

        buildStarted = true;
      }

      if (appSetup.status === 'pending') {
        updateProgress('Deployment in progress');

        setTimeout(pollDeployment(appSetup, buildStarted), 3000);
      } else if (appSetup.status === 'succeeded') {
        updateProgress('Finishing deployment');

        finishDeployment(appSetup);
      } else {
        updateProgress('Deployment failed', true);

        var err = new Error(appSetup.failure_message);

        if (appSetup.failure_message === 'build failed') {
          $.ajax({
            method: 'GET',
            url: appSetup.build.output_stream_url
          }).done(function(ouputStream) {

            err.detail = ouputStream;

            failed(err);
          }).fail(function(nerr) {
            console.error(nerr);

            failed(err);
          })
        } else {
          return failed(err);
        }
      }

    })
    .fail(function(err) {
      updateProgress('Deployment failed', true);

      failed(err);
    });
  };
}

function finishDeployment(appSetup) {
  console.log(appSetup);

  $.ajax({
    method: 'PATCH',
    url: '/api/heroku/apps/' + appSetup.app.name + '/config-vars',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify({
      TALK_ROOT_URL: 'https://' + appSetup.app.name + '.herokuapp.com'
    })
  }).done(function() {

    updateProgress('Deployment success');

    fetchAddons(appSetup);
  })
  .fail(function(err) {
    updateProgress('Deployment failed', true);

    failed(err);
  });
}

function fetchAddons(appSetup) {
  $.ajax({
    method: 'GET',
    url: '/api/heroku/apps/' + appSetup.app.name + '/addons',
    dataType: 'json',
    contentType: 'application/json',
  }).done(function(addons) {
    var options = {
      appSetup: appSetup,
      addons: addons
    };

    // set the options to finish in localStorage.
    Store.set('installation', options);

    finish(options);
  })
  .fail(function(err) {
    failed(err);
  });

}

function deleteDeployment(appSetup) {
  $.ajax({
    method: 'DELETE',
    url: '/api/heroku/apps/' + appSetup.app.id
  }).done(function() {

    // Purge the local installtion file...
    Store.remove('installation');

    location.reload();
  })
  .fail(function(err) {
    failed(err);
  });
}

function finish(options) {
  var appSetup = options.appSetup;
  var addons = options.addons;

  setTimeout(function() {
    $('#deployment-modal').modal('close');
  }, 2000);

  $('#delete-deployment').on('click', function(e) {
    e.preventDefault();

    $('#delete-deployment-modal').modal('open');

    $('#delete-deployment-confirm').one('click', function(e) {
      e.preventDefault();

      deleteDeployment(appSetup);
    });
  });

  $('#start-installation').fadeOut(function() {
    $('#facebook-oauth-redirect').text('https://' + appSetup.app.name + '.herokuapp.com/api/v1/auth/facebook/callback');
    $('#finish-installation-button').prop('href', appSetup.resolved_success_url);

    // Set the url to the addonservice for postmark.
    $('#activate-email-button').prop('href', addons.find(function(addon) {
      return addon.addon_service.name === 'postmark';
    }).web_url);

    $('#activate-email-button').on('click', function(e) {
      $('#finish-installation-post').fadeIn();
    });

    $('#finish-installation').fadeIn();
  });
}

$(document).ready(function() {

  // Enable the sideNav for the button collapse button.
  $('.button-collapse').sideNav();
  $('.modal').modal({
    dismissible: false
  });

  // If the form is on the page, then we are logged in.
  if ($('form')) {

    // Load the latest release.
    loadLatestRelease();

    // Attach to the form's state.
    attachToForm();
  }

  var installation = Store.get('installation');
  if (installation) {
    finish(installation);
  }
});
