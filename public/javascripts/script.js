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

  $("#errors .error-content").text(err);
  $("#errors").show();
}

function loadLatestRelease() {
  $.ajax({
    cache: false,
    method: 'GET',
    url: 'https://api.github.com/repos/wyattjoh/simple-web/releases/latest',
  })
  .then(function(release) {
    $('#latest-release').text(release.tag_name);
    $('#tarball-input').val(release.tarball_url);
    $('#latest-release-notes').html('Latest stable release of Talk is <a href="' + release.html_url + '" target="_blank">' + release.tag_name + '</a>');

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
    url: '/deploy',
    data: data
  }).done(function(deployment) {

    updateProgress('Deployment started');

    console.log('Deployment started with id ' + deployment.id);
    setTimeout(pollDeployment(deployment.id), 3000);
  })
  .fail(function(err) {
    updateProgress('Deployment failed', true);

    failed(err);
  });
}

function pollDeployment(id) {
  return function() {
    $.ajax({
      method: 'GET',
      dataType: 'json',
      contentType: 'application/json',
      url: '/deploy/' + id + '/status'
    }).done(function(setup) {
      if (setup.status === 'pending') {
        updateProgress('Deployment in progress');

        setTimeout(pollDeployment(id), 3000);
      } else if (setup.status === 'succeeded') {
        updateProgress('Finishing deployment');

        finishDeployment(setup);
      } else {
        updateProgress('Deployment failed', true);

        // Fail out with the error from Heroku.
        failed(new Error(setup.failure_message));
      }
    })
    .fail(function(err) {
      updateProgress('Deployment failed', true);

      failed(err);
    });
  };
}

function finishDeployment(setup) {
  console.log(setup);

  $.ajax({
    method: 'POST',
    url: '/deploy/' + setup.app.id + '/finish',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify(setup)
  }).done(function() {

    updateProgress('Deployment success', true);

    finish(setup);
  })
  .fail(function(err) {
    updateProgress('Deployment failed', true);

    failed(err);
  });
}

function finish(setup) {
  setTimeout(function() {
    $('#deployment-modal').modal('close');
  }, 2000);

  $('#delete-deployment').on('click', function(e) {
    e.preventDefault();

    $('#delete-deployment-modal').modal('open');

    $('#delete-deployment-confirm').one('click', function(e) {
      e.preventDefault();

      $.ajax({
        method: 'DELETE',
        url: '/deploy/' + setup.app.id
      }).done(function() {
        location.reload();
      })
      .fail(function(err) {
        failed(err);
      });
    });
  });

  $('#start-installation').fadeOut(function() {
    $('#facebook-oauth-redirect').text('https://' + setup.app.name + '.herokuapp.com/api/v1/auth/facebook/callback');
    $('#finish-installation-button').prop('href', setup.resolved_success_url);
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
});
