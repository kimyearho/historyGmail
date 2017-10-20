const { ipcRenderer } = require('electron');
const { BrowserWindow, app } = require('electron').remote;
const $ = require('jquery');

// Trello 인증저보
const idList = '59e9529545523941bd069339',
    key = '311df205a7034f67d0b40a0ebdd3c5b1',
    token = 'a046fc940550fa50a433ce410ca40adff1f72513d9d123182b87ad6dc61215e7'

$('#btn_auth').on('click', function () {
    ipcRenderer.send('request-auth', '1');
});

$('#btn_message').on('click', function () {
    getSnippet()
});

$('#btn_trello').on('click', function () {

    swal({
        title: "Card 제목 입력",
        text: "등록할 카드제목을 입력하세요.",
        type: "input",
        showCancelButton: true,
        closeOnConfirm: false,
        inputPlaceholder: "Write something"
    }, function (inputValue) {
        if (inputValue === false) return false;
        if (inputValue === "") {
            swal.showInputError("You need to write something!");
            return false
        }
        createCard(inputValue);
    });

});

// 인증완료
ipcRenderer.on('response-auth', (event, args) => {
    swal('인증완료!');
    $('#btn_auth').hide();
    $('#btn_trello').removeClass('hidden');
    $('#token').val(args.access_token);

    getProfile();
});

function getProfile() {
    $.ajax({
        type: 'get',
        url: 'https://www.googleapis.com/gmail/v1/users/me/profile',
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + $('#token').val());
        },
        success: function (json) {
            let text = 'email: ' + json.emailAddress
                + '\nmessagesTotal: ' + json.messagesTotal
                + '\nthreadsTotal: ' + json.threadsTotal;
            
            $('#username').text(json.emailAddress);
        }
    })
}

function getMessage() {
    $.ajax({
        type: 'get',
        url: 'https://www.googleapis.com/gmail/v1/users/me/messages',
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + $('#token').val())
        },
        success: function (json) {
            $(json.messages).each(function (i, item) {
                let threadId = item.threadId
                $.ajax({
                    type: 'get',
                    url: 'https://www.googleapis.com/gmail/v1/users/me/messages/' + threadId,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Authorization", "Bearer " + $('#token').val())
                    },
                    success: function (json) {
                        let parts_1 = json.payload.parts
                        if (parts_1 != undefined) {
                            let mimeType = parts_1[0].mimeType
                            // mimeType에 따라서 응답구조가 다름.
                            if (mimeType == 'text/plain') {
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
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + $('#token').val())
        },
        success: function (json) {
            $(json.messages).each(function (i, item) {
                let threadId = item.threadId
                $.ajax({
                    type: 'get',
                    url: 'https://www.googleapis.com/gmail/v1/users/me/messages/' + threadId + '?format=metadata',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Authorization", "Bearer " + $('#token').val())
                    },
                    success: function (json) {
                        if (json != undefined) {
                            console.log(json)
                            let subject, to, from, cc, name, elements, headers;
                            // 보낸사람 필터
                            let array = ['천영학 <younghak@nkia.co.kr>', '경민성 <wildfire1974@in-soft.co.kr>', '오상영 <syoh@in-soft.co.kr>', '박규태 <ktpark@in-soft.co.kr>'];
                            headers = json.payload.headers
                            $(headers).each(function (i, item) {
                                if (item.name == 'From')
                                    from = item.value.replace(/\"/g, "");
                                if (item.name == 'Subject')
                                    subject = item.value;
                                if (from != undefined && subject != undefined) {
                                    for (let k = 0; k < array.length; k++)
                                        if (from == array[k])
                                            $('#mailList tbody').append(
                                                '<tr>'
                                                + '<td style="text-align:center;"><input type="checkbox" name="chk" value="' + threadId + '" /></td>'
                                                + '<td>' + from + '</td>'
                                                + '<td>' + subject + '</td>' +
                                                '</tr>'
                                            );
                                    return false;
                                }
                            });
                        }

                        $('#btn_message').addClass('disabled');
                        $('#btn_message').text('계속 연결 중...');
                    }
                })
            });
        }
    })
}

function createCard(str) {
    let threadArray = new Array();
    $("input[name=chk]:checked").each(function () {
        let threadId = $(this).val();
        threadArray.push(threadId)
    });

    if (threadArray.length > 0) {
        $(threadArray).each(function (i, threadId) {
            $.ajax({
                type: 'get',
                url: 'https://www.googleapis.com/gmail/v1/users/me/messages/' + threadId,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Bearer " + $('#token').val())
                },
                success: function (json) {
                    let parts_1 = json.payload.parts
                    if (parts_1 != undefined) {
                        let mimeType = parts_1[0].mimeType
                        // mimeType에 따라서 응답구조가 다름.
                        if (mimeType == 'text/plain') {
                            // mimeType이 text/plain 일 경우 메일 본문 메시지
                            let body = parts_1[0].body.data

                            // 카드등록
                            trelloCardCreateRequest(str, base64Decode(body));
                        } else {
                            // mimeType이 multipart 일 경우 메일 본문 메시지
                            let parts_2 = parts_1[0].parts[0]
                            let body = parts_2.body.data

                            // 카드등록
                            trelloCardCreateRequest(str, base64Decode(body));
                        }
                    }
                }
            })
        })
    }
}

function base64Decode(str) {
    let buff = new Buffer(str, 'base64'),
        text = buff.toString('utf8');

    return text;
}

function trelloCardCreateRequest(name, desc) {
    $.ajax({
        type: 'post',
        url: 'https://api.trello.com/1/cards?idList=' 
            + idList 
            + '&key=' + key 
            + '&token=' + token 
            + '&name=' + name 
            + '&desc=' + desc,
        success: function (json) {
            swal("Nice!", "등록완료!"); 

            // 체크된 메일 체크해제
            $('input[name=chk]:checked').prop('checked', false)
        }
    })
}