const {ipcRenderer} = require('electron');
const {BrowserWindow, app} = require('electron').remote;
const $ = require('jquery');

$('#btn_auth').on('click', function() {
    ipcRenderer.send('request-auth', '1');
});

$('#btn_message').on('click', function() {
    getSnippet()
});

// 인증완료
ipcRenderer.on('response-auth', (event, args) => {
    alert('인증성공!');
    $('#btn_auth').hide();
    $('#btn_trello').removeClass('hidden');
    $('#token').val(args.access_token);
});

function getProfile() {
    $.ajax({
        type: 'get',
        url: 'https://www.googleapis.com/gmail/v1/users/me/profile',
        beforeSend : function(xhr){
            xhr.setRequestHeader("Authorization", "Bearer " + $('#token').val());
        },
        success : function(json) {
           let text = 'email: ' + json.emailAddress
            + '\nmessagesTotal: ' + json.messagesTotal
            + '\nthreadsTotal: ' + json.threadsTotal
           $('#results').html(text)
        }
    })
}

function getMessage() {
    $.ajax({
        type: 'get',
        url: 'https://www.googleapis.com/gmail/v1/users/me/messages',
        beforeSend :  function(xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + $('#token').val())
        },
        success : function(json) {
            $(json.messages).each(function(i, item) {
                let threadId = item.threadId
                $.ajax({
                    type: 'get',
                    url: 'https://www.googleapis.com/gmail/v1/users/me/messages/' + threadId,
                    beforeSend : function(xhr) {
                        xhr.setRequestHeader("Authorization", "Bearer " + $('#token').val())
                    },
                    success : function(json) {
                        let parts_1 = json.payload.parts
                        if(parts_1 != undefined) {
                            let mimeType = parts_1[0].mimeType
                            // mimeType에 따라서 응답구조가 다름.
                            if(mimeType == 'text/plain') {
                                // mimeType이 text/plain 일 경우 메일 본문 메시지
                                let body = parts_1[0].body.data
                            } else {
                                // mimeType이 multipart 일 경우 메일 본문 메시지
                                let parts_2 = parts_1[0].parts[0]
                                let body = parts_2.body.data
                            }
                        }
                    }
                })
            });
        }
    })
}

function getSnippet() {
    $.ajax({
        type: 'get',
        url: 'https://www.googleapis.com/gmail/v1/users/me/messages',
        beforeSend :  function(xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + $('#token').val())
        },
        success : function(json) {
            $(json.messages).each(function(i, item) {
                let threadId = item.threadId
                $.ajax({
                    type: 'get',
                    url: 'https://www.googleapis.com/gmail/v1/users/me/messages/' + threadId + '?format=metadata',
                    beforeSend : function(xhr) {
                        xhr.setRequestHeader("Authorization", "Bearer " + $('#token').val())
                    },
                    success : function(json) {
                        if(json != undefined) {
                            let subject, to, from, cc, name, elements, headers;
                            // 보낸사람 필터
                            let array = ['천영학 <younghak@nkia.co.kr>', '경민성 <wildfire1974@in-soft.co.kr>', '오상영 <syoh@in-soft.co.kr>'];
                            headers = json.payload.headers
                            $(headers).each(function(i, item) {
                                if(item.name == 'From') 
                                    from = item.value.replace(/\"/g, "");
                                if(item.name == 'Subject')
                                    subject = item.value;
                                if(from != undefined && subject != undefined) {
                                    for(let k = 0; k < array.length; k++)
                                        if(from == array[k])
                                            $('#mailList tbody').append(
                                                '<tr>'
                                                    + '<td>' + from + '</td>'
                                                    + '<td>' + subject + '</td>' +
                                                '</tr>'
                                            );
                                    return false;
                                }
                            });
                        }
                    }
                })
            });
        }
    })
}
