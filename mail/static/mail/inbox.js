document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-form').addEventListener('submit', send_email);
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#view-email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').innerHTML = '';
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      emails.forEach(element => {
        get_email(parseInt(element.id))
        let email = load_email(element, mailbox)
        document.querySelector('#emails-view').append(email);
      });
  });
}

function send_email() {
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value,
    })
  })
  .then(response => response.json())
  .then(result => {
    if (result.error) {
      alert(result.error)
    } else {
      load_mailbox('sent')
    }
  })
}

function get_email(email_id) {
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
}

function load_email(email, mailbox) {
  const element = document.createElement('div');
  
  let sub = email['subject'];
  if (email['subject'] === '') {
    sub = '<i>No subject</i>'
  }

  let div_class = 'form-group row email_instance';
  if (email['read'] === true) {
    div_class = 'form-group row email_instance read'
  }

  element.innerHTML = `
    <div class='${div_class}'>
      <div class='col-sm-4'>
       <strong>${email['sender']}</strong>
      </div>
      <div class='col-sm-4'>
        ${sub}
      </div>
      <div class='col-sm-4' style="text-align: right;">
        ${email['timestamp']}
      </div>
    </div>
  `

  element.addEventListener('click', function() {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#view-email').style.display = 'block';
    mark_read(email)
    view_email(email, mailbox)
  });
  return element;
}

function view_email(email, mailbox) {
  document.querySelector('#view-timestamp').value = email.timestamp;
  document.querySelector('#view-from').value = email.sender;
  document.querySelector('#view-to').value = email.recipients;
  document.querySelector('#view-subject').innerHTML = email.subject;
  document.querySelector('#view-body').innerHTML = email.body;

  if (email.archived === true && mailbox != 'sent') {
    document.querySelector('#archive-button').style.display = 'block';
    document.querySelector('#archive-button').innerHTML = "Unarchive";
  } else if (email.archived === false && mailbox != 'sent') {
    document.querySelector('#archive-button').style.display = 'block';
    document.querySelector('#archive-button').innerHTML = "Archive";
  } else {
    document.querySelector('#archive-button').style.display = 'none';
  }

  const archive_old = document.querySelector('#archive-button');
  const archive_new = archive_old.cloneNode(true);

  archive_old.parentNode.replaceChild(archive_new, archive_old);
  archive_new.addEventListener('click', () => {archive(email)});

  const reply_old = document.querySelector('#reply-button');
  const reply_new = reply_old.cloneNode(true);

  reply_old.parentNode.replaceChild(reply_new, reply_old);
  reply_new.addEventListener('click', () => {reply(email)});
}

function mark_read(email) {
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true,
    })
  })
}

function archive(email) {
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: !email.archived,
    })
  })
  .then(() => {
    load_mailbox('inbox')
  })
}

function reply(email) {
  compose_email();
  document.querySelector('#compose-recipients').value = email.sender;
  const old_subject = document.querySelector('#compose-subject');
  if (`${email.subject.slice(0,4)}` === "Re: ") {
    old_subject.value = `${email.subject}`;
  } else {
    old_subject.value = `Re: ${email.subject}`;
  }
  document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote: "${email.body}"`;
}