
/**
 * Created by lugy90 on 2018/2/22.
 */

const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const app = express();


var tidx = 0;
var rightCount = 0;
var questionHistory = {
  action:'QUESTION_HISTORY'
};
var authorizedUser;
var actCountOver = 0;
var actStartTime;
var mainT;
var taskT;
var taskEmitTime = [];
var lastTaskEnd = [];


var questions = [
  {
    question:{
      activityId: 1,
      answer: "3",
      endTime: 100,
      optionList: [
        {answer:"塑料姐妹花", addExtra: 0, optionId: 1},
        {answer:"老铁好基友", addExtra: 0, optionId: 2},
        {answer:"绝对亲兄弟", addExtra: 0, optionId: 3}
      ],
      questionId: 1,
      questionNo: 1,
      questionType: "无语恶搞",
      showTime: 10,
      startTime: 100,
      title: "哪种关系形容小智和皮卡丘最准确？"
    },
    timestamp: 100,
    action:'QUESTION'
  },

  {
    question:{
      activityId: 1,
      answer: "3",
      endTime: 100,
      optionList: [
        {answer:"塑料姐妹花A", addExtra: 0, optionId: 1},
        {answer:"老铁好基友A", addExtra: 0, optionId: 2},
        {answer:"绝对亲兄弟A", addExtra: 0, optionId: 3}
      ],
      questionId: 2,
      questionNo: 2,
      questionType: "无语恶搞A",
      showTime: 10,
      startTime: 100,
      title: "哪种关系形容小智和皮卡丘最准确A？"
    },
    answerResult: {
      activityId: 1,
      answer: "3",
      optionList: [
        {answer:"塑料姐妹花", addExtra: 0, optionId: 1, succCount: 100},
        {answer:"老铁好基友", addExtra: 0, optionId: 2, succCount: 109},
        {answer:"绝对亲兄弟", addExtra: 0, optionId: 3, succCount: 832}
      ],
      questionId: 1,
      questionNo: 1,
      questionType: "无语恶搞",
      title: "哪种关系形容小智和皮卡丘最准确？"
    },
    timestamp: 100,
    action:'QUESTION'
  },

  {
    question: {
      activityId: 1,
      answer: "3",
      endTime: 100,
      optionList: [
        {answer:"塑料姐妹花B", addExtra: 0, optionId: 1},
        {answer:"老铁好基友B", addExtra: 0, optionId: 2},
        {answer:"绝对亲兄弟B", addExtra: 0, optionId: 3}
      ],
      questionId: 3,
      questionNo: 3,
      questionType: "无语恶搞B",
      showTime: 10,
      startTime: 100,
      title: "哪种关系形容小智和皮卡丘最准确B？"
    },
    answerResult: {
      activityId: 1,
      answer: "3",
      optionList: [
        {answer:"塑料姐妹花A", addExtra: 0, optionId: 1, succCount: 100},
        {answer:"老铁好基友A", addExtra: 0, optionId: 2, succCount: 109},
        {answer:"绝对亲兄弟A", addExtra: 0, optionId: 3, succCount: 832}
      ],
      questionId: 2,
      questionNo: 2,
      questionType: "无语恶搞A",
      title: "哪种关系形容小智和皮卡丘最准确A？"
    },
    timestamp: 100,
    action:'QUESTION'
  },

  {
    question: {
      activityId: 1,
      answer: "3",
      endTime: 100,
      optionList: [
        {answer: "塑料姐妹花C", addExtra: 0, optionId: 1},
        {answer: "老铁好基友C", addExtra: 0, optionId: 2},
        {answer: "绝对亲兄弟C", addExtra: 0, optionId: 3}
      ],
      questionId: 4,
      questionNo: 4,
      questionType: "无语恶搞C",
      showTime: 10,
      startTime: 100,
      title: "哪种关系形容小智和皮卡丘最准确C？"
    },
    answerResult: {
      activityId: 1,
      answer: "3",
      optionList: [
        {answer:"塑料姐妹花B", addExtra: 0, optionId: 1, succCount: 100},
        {answer:"老铁好基友B", addExtra: 0, optionId: 2, succCount: 109},
        {answer:"绝对亲兄弟B", addExtra: 0, optionId: 3, succCount: 832}
      ],
      questionId: 3,
      questionNo: 3,
      questionType: "无语恶搞B",
      title: "哪种关系形容小智和皮卡丘最准确B？"
    },
    timestamp: 100,
    action:'QUESTION'
  },

  {
    answerResult: {
      activityId: 1,
      answer: "3",
      optionList: [
        {answer:"塑料姐妹花C", addExtra: 0, optionId: 1, succCount: 100},
        {answer:"老铁好基友C", addExtra: 0, optionId: 2, succCount: 109},
        {answer:"绝对亲兄弟C", addExtra: 0, optionId: 3, succCount: 832}
      ],
      questionId: 4,
      questionNo: 4,
      questionType: "无语恶搞C",
      title: "哪种关系形容小智和皮卡丘最准确C？"
    },
    timestamp: 100,
    action:'QUESTION'
  }
];

app.use(function (req, res) {
  res.send({ msg: "hello" });
});

const server = http.createServer(app);
server.setTimeout(0);
server.timeout = 0;
const wss = new WebSocket.Server({ server });


const timePush = function (idx) {
  let ct = lastTaskEnd[idx];
  let et = taskEmitTime[idx];
  console.log('推送时间点');
  console.log(ct);
  console.log(et);
  clearTimeout(taskT);
  return new Promise((resolve, reject) => {
    console.log('时间间隔',et-ct);
    taskT = setTimeout(() => {
      resolve();
    }, et-ct)
  })
};

function noop() {}

// function heartbeat() {
//   this.isAlive = true;
// }

wss.on('connection', function connection(ws, req) {
  console.log('连接成功');
  const location = url.parse(req.url, true);
  // You might use location.query.access_token to authenticate or share sessions
  // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  const ip = req.connection.remoteAddress; // ip address of the client

  // ws.isAlive = true;
  // ws.on('pong', heartbeat);
  ws.on('error', (err) => console.log('errored', err));


  if (!actCountOver) {
    console.log('场次计时')
    activityCount(ws);
  }

  console.log('场次计时是否结束',actCountOver);
  console.log('tidx', tidx);

  if (tidx < questions.length && actCountOver) {
      console.log('发送历史数据')
      if (typeof questionHistory === "string") questionHistory = JSON.parse(questionHistory);
      questionHistory.timestamp = Date.now();
      if (typeof questionHistory === "object") questionHistory = JSON.stringify(questionHistory);
      ws.send(questionHistory, function histhen(error) {
        if (error) {
          console.log('EXCEPT', error)
        } else {
          nextTask(ws);
        }
      });
  }


  ws.on('message', function incoming(payload) {
    let data = JSON.parse(payload);
    authorizedUser = data.authorizedUser;

    if (data.action == "ANSWER") {
      if (data.data.answer == questions[data.data.questionNo - 1].question.answer || data.data.reviveCardId) {
        console.log('----right answer !!!!----');
        rightCount += 1;
      }
    }
  });
});

//close broken connections
// const interval = setInterval(function ping() {
//   wss.clients.forEach(function each(ws) {
//     if (ws.isAlive === false) return ws.terminate();
//
//     ws.isAlive = false;
//     ws.ping(noop);
//   });
// }, 30000);


function activityCount(ws) {
  if (ws.readyState === WebSocket.OPEN) {
    const timestamp = Date.now();
    if (!actStartTime) actStartTime = Date.now() + 3000;
    let data = {
      timestamp,
      data: {
        startTime: actStartTime,
        questionPoints:'敲黑板'
      },
      action: 'ACTIVITY_INFO'
    };
    let timeStation = actStartTime; //OK
    lastTaskEnd[0] = actStartTime; //OK
    questions.map( (q,i) => {
      q.timestamp = timeStation + 2000; //OK
      taskEmitTime[i] = q.timestamp;
      if (q.question) {
        q.question.startTime = q.timestamp + 5000;
        q.question.endTime = q.question.startTime + 10000;
        timeStation = q.question.endTime + 2000;
        lastTaskEnd[i+1] = taskEmitTime[i];
      }
    });

    data = JSON.stringify(data);
    ws.send(data, function acti(error) {
      if (error) {
        console.log('EXCEPT', error)
      } else {
        clearTimeout(mainT);
        mainT = setTimeout(()=>{
          actCountOver = 1;
          nextTask(ws);
        }, actStartTime-timestamp)
      }
    })
  }
}

function nextTask(ws) {
    // let gap = tidx == 0 ? 0 : 20000;
    timePush(tidx).then(()=>{
      console.log('任务序列处理', tidx)
      let d = {};
      console.log(questions[tidx].timestamp);
      d.timestamp = questions[tidx].timestamp;
      d.action = questions[tidx].action;
      d.data = {};
      d.data.question = questions[tidx].question;
      d.data.answerResult = questions[tidx].answerResult;
      if (tidx == 4) {
        console.log('总正确数',rightCount);
        d.data.answerResult.end = 1;
        d.data.answerResult.winnerData = {};
        d.data.answerResult.winnerData.userList = [];
      }
      if (rightCount == 4) {
        d.data.answerResult.winnerData = {};
        d.data.answerResult.winnerData.userList = [
          {
            userId: authorizedUser.hlUserId,
            wxNickName: authorizedUser.wxNickname,
            wxHeadImg: authorizedUser.wxHeadicon
          }
        ];
      }
      d = JSON.stringify(d);
      if (ws.readyState === WebSocket.OPEN && tidx < questions.length) {
        console.log('连接next',tidx)
        ws.send(d, function ack(error) {
          if (error) {
            console.log('EXCEPT', error)
          } else {
            console.log('已发')
            if (typeof questionHistory === "string") questionHistory = JSON.parse(questionHistory);
            questionHistory.data = questionHistory.data ? questionHistory.data : [];
            questionHistory.data.push(questions[tidx]);
            tidx += 1;
            nextTask(ws);
          }
        });
      } else if (ws.readyState != WebSocket.OPEN && tidx < questions.length){
        console.log('未连接next',tidx)
        if (typeof questionHistory === "string") questionHistory = JSON.parse(questionHistory);
        questionHistory.data = questionHistory.data ? questionHistory.data : [];
        questionHistory.data.push(questions[tidx]);
        tidx += 1;
        nextTask(ws);
      }
    })

}

server.listen(8080, function listening() {
  console.log('Listening on %d', server.address().port);
});
