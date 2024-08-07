var w,
  h,
  i,
  s,
  g,
  my = {};
function init(imode) {
  var version = "0.942";
  my.mode = getJSQueryVar("mode", "Add");
  my.optQ = true;
  if (my.mode == "express") {
    my.mode = "Add";
    my.optQ = false;
  }
  console.log("math trainer", my.mode, my);
  w = window.innerWidth - 30;
  if (w < 380) w = 380;
  if (w > 600) w = 600;
  h = 800;
  // my.tabs = ["Add", "Subtract", "Multiply", "By 12", "By 15", "Divide"];
  my.tabs = ["Add", "Subtract", "Multiply", "Divide"];
  var tabNo = my.tabs.indexOf(my.mode);
  loadGames();
  my.game = my.games[0];
  my.cutoffs = [
    ["2 Secs", 2],
    ["4 Secs", 4],
    ["8 Secs", 8],
    ["30 Secs", 30],
    ["1 Min", 60],
    ["1 Day", 86400],
  ];
  my.times = [
    ["10 Sec", 10],
    ["1 Min", 60],
    ["2 Mins", 120],
    ["3 Mins", 180],
    ["5 Mins", 300],
    ["10 Mins", 600],
    ["1 Day", 86400],
  ];
  var s = "";
  s +=
    '<audio id="sndyes" src="../images/sounds/yes2.mp3" preload="auto"></audio>';
  s +=
    '<audio id="sndno" src="../images/sounds/no.mp3" preload="auto"></audio>';
  s +=
    '<div style="display: block; position: relative; max-width: ' +
    w +
    "px; min-height: " +
    h +
    'px; margin: auto; border: none; border-radius: 20px;  ">';
  var sPop = "";
  sPop +=
    '<div style="display: block; position: relative; width: 100%; text-align: center; margin: 0 auto 0 auto; ">';
  var tab;
  for (i = 0; i < my.tabs.length; i++) {
    tab = my.tabs[i];
    sPop += '<div id="t' + i + '" ';
    sPop +=
      'style="display: inline-block; width: 70px; font: 16px Arial;   position: relative; padding: 5px; margin: 3px;  color: #385c5b; text-align: center; border-radius: 3px;	cursor: pointer; background: linear-gradient(to top, rgba(255,220,130,1) 0%, rgba(255,255,255,1) 100%)"  onclick="doTab(this.id)">' +
      tab;
    sPop += "</div>";
  }
  sPop += "</div>";
  if (my.optQ) {
    sPop +=
      '<div id="options" style="position: relative; margin: 2px auto 2px auto;  font: 15px Arial; z-index:100; width: 98%; text-align: center; display: block; padding: 1%; background-color: rgba(210,230,255,0.6); border-radius: 10px; ">';
    sPop += "<span >Workout Time: </span>";
    sPop += getDropdownHTML(my.times, "chgTime", "time");
    sPop += " &nbsp; ";
    sPop += "<span>Question Cutoff: </span>";
    sPop += getDropdownHTML(my.cutoffs, "chgCutoff", "cutoff");
    sPop += "</div>";
  }
  sPop +=
    '<div style="display:block; position: relative; margin: 0 auto 0 auto; text-align:center; ">';
  sPop += '<div id="tabContent"></div>';
  sPop += "</div>";
  sPop +=
    '<div style="display:block; position: relative; margin: 30px 0 0 0; text-align:left; ">';
  sPop +=
    '<button onclick="clearEquns()" class="togglebtn" style="z-index: 22; color:red; font: italic 14px Arial;" >Clear your history (set all to 0%)</button>';
  sPop += "</div>";
  my.pop = new Pop("my.pop", w - 40);
  s += my.pop.getPopHTML(sPop);
  s +=
    '<div id="train" style="position: absolute; top: 5px; left:0; width:100%; padding: 0; z-index: 5; opacity: 1; transition: all linear 0.3s; margin:auto; ">';
  s += getTrainerHTML();
  s += "</div>";
  s +=
    '<div id="tablepop" style="opacity: 0; font: 24px Arial; color: #6600cc; position:absolute; left:5px; bottom:5px; width:180px; height:35px; text-align:center;background-color: #eeffee; border: 1px solid #ffdd00; border-radius: 5px;  transition: all linear 2s; z-index: 100;">fact</div>';
  s += wrap(
    {
      cls: "copyrt",
      pos: "abs",
      style: "left:5px; bottom:3px",
    },
    "&copy; 2023 Rod Pierce v" + version
  );
  s += "</div>";
  docInsert(s);
  if (my.optQ) {
    document.getElementById("time").value = "5 Mins";
    document.getElementById("cutoff").value = "4 Secs";
  }
  var timers = [
    ["cutoffcanvas", 40],
    ["timercanvas", 60],
  ];
  var gs = [];
  for (i = 0; i < timers.length; i++) {
    var cw = timers[i][1];
    var ch = cw;
    var div = document.getElementById(timers[i][0]);
    var ratio = 2;
    div.width = cw * ratio;
    div.height = ch * ratio;
    div.style.width = cw + "px";
    div.style.height = ch + "px";
    g = div.getContext("2d");
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    gs[i] = g;
  }
  my.isGameOver = false;
  my.isGamePaused = false;
  my.timeoutQ = false;
  my.currEqun = new Equn();
  my.rightNum = 0;
  my.ansNum = 0;
  my.hists = [];
  my.queue = [];
  my.table = [];
  my.equns = new Equns();
  var cook = getCookie("trainer");
  my.equns.useDBString(cook);
  my.ctimer = new Timer(gs[0], 20, 60, "#cccc00", cutoffCallback);
  my.qtimer = new Timer(gs[1], 30, 60, "#0000ff", endGameCallback);
  my.prevRightQ = true;
  window.addEventListener("keydown", checkKeyPressed, false);
  doTab("t" + tabNo.toString());
  if (my.optQ) {
    my.pop.popup();
  } else {
    newGame("mult-10");
  }
  setupTable();
  document.getElementById("table").innerHTML = getTableHTML();
  soundToggle();
}
function doTab(id) {
  var idNo = Number(id.substr(1));
  var div = document.getElementById("tabContent");
  div.innerHTML = getTabContent(idNo);
}
function getTabContent(n) {
  var s = "";
  var tab = my.tabs[n];
  s +=
    '<div id="c' +
    n +
    '" style="padding: 0; z-index: 5; transition: all linear 0.6s; margin:auto; ">';
  s += getTabHTML(tab);
  s += "</div>";
  return s;
}
function getTime() {
  if (!my.optQ) {
    return 300;
  }
  var el = document.getElementById("time");
  if (el.selectedIndex == -1) return null;
  var t = el.options[el.selectedIndex].text;
  for (var i = 0; i < my.times.length; i++) {
    if (my.times[i][0] == t) {
      return my.times[i][1];
    }
  }
  return 100;
}
function getCutoff() {
  if (!my.optQ) {
    return 4;
  }
  var el = document.getElementById("cutoff");
  if (el.selectedIndex == -1) return null;
  var t = el.options[el.selectedIndex].text;
  for (var i = 0; i < my.cutoffs.length; i++) {
    if (my.cutoffs[i][0] == t) {
      return my.cutoffs[i][1];
    }
  }
  return 10;
}
function cutoffCallback() {
  cutoff();
}
function cutoff() {
  if (!my.isGameOver) {
    check2();
  }
}
function endGameCallback() {
  endGame();
}
function endGame() {
  my.ctimer.stop();
  my.isGameOver = true;
  createCookie("trainer", my.equns.getDBString(), 1000);
  document.getElementById("summary").innerHTML = getSummary();
  document.getElementById("summary").style.visibility = "visible";
}
function getSummary() {
  var s = "";
  var tm = getTime();
  s += '<p style="font: 16px Verdana;">';
  s += "Workout" + ": " + fmtTime(tm) + "<br/>";
  var ct = getCutoff();
  s += "Cutoff" + ": " + fmtTime(ct) + "<br/>";
  s += "</p>";
  if (my.ansNum > 0) {
    s += '<p style="font: 22px Verdana;">';
    s +=
      "You answered" +
      " " +
      my.ansNum +
      " " +
      "questions and got" +
      " " +
      my.rightNum +
      " " +
      " correct";
    var pctRight = (100 * my.rightNum) / my.ansNum;
    s +=
      "<br>(this session: " +
      parseInt(pctRight + 0.49) +
      "% " +
      "correct" +
      ")";
    s += "</p>";
    var goodNum = Math.round(tm / 3);
    console.log("my.ansNum", my.ansNum, goodNum);
    if (my.ansNum < goodNum) {
      s += '<p style="font: italic 16px Verdana;">';
      s += "Try to answer at least " + goodNum + " questions in " + fmtTime(tm);
      s += "</p>";
    }
    var stats = getTableStats([1, 1, 10, 10]);
    if (stats.length > 0 && stats[1] > 0) {
      s += "<br>";
      s +=
        '<div style="color: #88aaff; background-color: #69f; margin:10px; border-radius: 10px; border: 1px solid #8af; ">';
      s +=
        '<div style="font: bold 14px Verdana; text-align:left; padding:1px 0 3px 8px; color: yellow; ">';
      s += "Overall (1 to 10) Table Results:";
      s += "</div>";
      s += '<div style="font: 20px Verdana; color:yellow; padding:5px;">';
      var pct = parseInt((stats[0] / stats[1]) * 100 + 0.49);
      if (pct > 99) {
        s += "You have mastered ALL the facts!";
        s += "<br>Bravo and Well Done!";
      } else {
        s += "You have mastered " + stats[0] + " of " + stats[1] + " facts";
        s += "<br>";
        s +=
          "Average score for the whole table is " +
          parseInt(stats[2] * 100 + 0.49) +
          "%";
      }
      s += "</div>";
      s += "</div>";
    }
  }
  s +=
    '<button id="againBtn" onclick="newGame()" style="z-index:3; position:absolute; left:3px; top:5px;" class="togglebtn" >Again</button>';
  return s;
}
function newGame(id) {
  my.pop.yes();
  for (var i = 0; i < my.games.length; i++) {
    if (my.games[i].id == id) {
      my.game = my.games[i];
      break;
    }
  }
  my.hists = [];
  document.getElementById("hist").innerHTML = "";
  my.rightNum = 0;
  my.ansNum = 0;
  document.getElementById("ansNum").innerHTML = "&nbsp;";
  document.getElementById("rightNum").innerHTML = "&nbsp;";
  document.getElementById("rightPct").innerHTML = "&nbsp;";
  document.getElementById("hist").innerHTML = "&nbsp;";
  document.getElementById("summary").style.visibility = "hidden";
  setupTable();
  my.queue = [];
  fillQueue();
  document.getElementById("currQ").innerHTML = "";
  document.getElementById("currA").innerHTML = "";
  my.v321 = 3;
  countDown();
}
function clearEquns() {
  my.equns = new Equns();
  var div = document.getElementById("table");
  div.innerHTML = "";
}
function countDown() {
  document.getElementById("v321").innerHTML = my.v321.toString();
  my.v321--;
  if (my.v321 < 0) {
    document.getElementById("v321").innerHTML = "";
    reallyStartGame();
  } else {
    setTimeout(countDown, 1000);
  }
}
function reallyStartGame() {
  my.isGameOver = false;
  my.isGamePaused = false;
  my.timeoutQ = false;
  my.qtimer.restart(getTime());
  my.prevRightQ = false;
  newQ();
}
function setupTable() {
  var tileWidth = 30,
    tileHeight = 20;
  var limits = my.game.limits;
  var rows = limits[2] - limits[0] + 1;
  var cols = limits[3] - limits[1] + 1;
  var tableX = w / 2 - (tileWidth * cols) / 2;
  var tableY = 295 - (tileHeight * rows) / 2;
  my.table = [];
  for (var i = 0; i < rows; i++) {
    my.table[i] = [];
    for (var j = 0; j < cols; j++) {
      var eq = new Equn();
      eq.setQ(my.game.ops, limits[0] + i, limits[1] + j);
      eq.y = tableY + i * tileHeight;
      eq.x = tableX + j * tileWidth;
      my.equns.setHist(eq);
      my.table[i][j] = eq;
    }
  }
}
function newQ() {
  if (my.queue.length > 0) {
    my.currEqun = my.queue.shift();
  } else {
    my.currEqun.makeQ(my.game.ops, my.game.limits, "R");
  }
  document.getElementById("currQ").innerHTML = my.currEqun.getQ();
  document.getElementById("currA").innerHTML = "&nbsp;";
  my.ans = "";
  if (my.prevRightQ) {
    my.ctimer.restart(getCutoff());
  } else {
    my.ctimer.stop();
  }
  document.getElementById("table").innerHTML = getTableHTML();
}
function getTableStats(limits) {
  var op = my.game.ops;
  var eqs = my.equns.eqs;
  var tot = 0;
  var good = 0;
  var ratSum = 0;
  if (op in eqs) {
    for (var a = limits[0]; a <= limits[2]; a++) {
      for (var b = limits[1]; b <= limits[3]; b++) {
        if (op == "-" && a - b < 0) continue;
        tot++;
        var ab = a + "_" + b;
        if (ab in eqs[op]) {
          var rat = eqs[op][ab].getRatio();
          ratSum += rat;
          if (rat > 0.99) {
            good++;
          }
        } else {
        }
      }
    }
  }
  var ratAvg = 0;
  if (tot > 0) ratAvg = ratSum / tot;
  return [good, tot, ratAvg];
}
// TODO: Edit to show just the 1's place; Max of 10 [Or just have a separate function for "Double Digits" and "Decimals"]
function getTableHTML() {
  var s = "";
  var tileWidth = 33;
  var tileHeight = 20;
  var limits = my.game.limits;
  var cols = limits[3] - limits[1] + 1;
  var rows = limits[2] - limits[0] + 1;
  var tableX = 25;
  var tableY = 20;
  s +=
    '<div style="position:relative; width:' +
    (tileWidth + cols * tileWidth) +
    "px; height:" +
    (tileHeight + rows * tileHeight) +
    'px; margin:auto; text-align: center;">';
  var j;
  for (var i = 0; i < my.table.length; i++) {
    var r = my.table[i];
    for (j = 0; j < r.length; j++) {
      var eq = r[j];
      if (eq.answer >= 0) {
        s +=
          '<div id="table_' +
          i +
          "_" +
          j +
          '" style="position: absolute; left:' +
          (tableX + j * tileWidth) +
          "px; top:" +
          (tableY + i * tileHeight) +
          "px; width:" +
          tileWidth +
          "px; height:" +
          tileHeight +
          "px; z-index: 5; border: 1px solid #8888ff; border-radius: 5px; background-color: " +
          eq.getClr() +
          ';" onmouseover="showTablePopup(this)">';
        s += eq.getPct() + "%";
        s += "</div>";
      }
    }
  }
  for (i = 0; i < limits[2] - limits[0] + 1; i++) {
    s +=
      '<div style="position: absolute; left:' +
      (tableX - 14) +
      "px; top:" +
      (tableY + i * tileHeight + 2) +
      'px; z-index: 5; border: none; text-align: right;" >';
    s += limits[0] + i;
    s += "</div>";
  }
  for (j = 0; j < limits[3] - limits[1] + 1; j++) {
    s +=
      '<div style="position: absolute; left:' +
      (tableX + j * tileWidth + 15) +
      "px; top:" +
      (tableY - 17) +
      'px; z-index: 5; border: none; text-align: center;" >';
    s += limits[1] + j;
    s += "</div>";
  }
  s += "</div>";
  return s;
}
function showTablePopup(cell) {
  var pop = document.getElementById("tablepop");
  pop.style.transitionDuration = "0s";
  pop.style.opacity = 1;
  pop.style.zIndex = 100;
  var left = cell.style.left;
  left = left.replace(/px/g, "") >> 0;
  left -= 60;
  left = Math.min(Math.max(0, left), w - 180);
  pop.style.left = left + "px";
  var top = cell.style.top;
  top = top.replace(/px/g, "") >> 0;
  top += 480;
  pop.style.top = top + "px";
  var celldata = cell.id.split("_");
  var i = celldata[1];
  var j = celldata[2];
  var eq = my.table[i][j];
  pop.innerHTML = eq.qStr + eq.answer;
  my.popupStt = new Date();
  setTimeout(hideTablePopup, 2000);
}
function hideTablePopup() {
  var now = new Date();
  var elapsed = now - my.popupStt;
  if (elapsed > 1900) {
    var pop = document.getElementById("tablepop");
    pop.style.transitionDuration = "1s";
    pop.style.opacity = 0;
    pop.style.zIndex = 0;
  }
}
function getAutoQuestion() {
  var probSum = 0;
  var r, j, eq;
  for (var i = 0; i < my.table.length; i++) {
    r = my.table[i];
    for (j = 0; j < r.length; j++) {
      eq = r[j];
      probSum += eq.getProb();
    }
  }
  var randProb = Math.random() * probSum;
  var runningSum = 0;
  var foundQ = false;
  for (i = 0; i < my.table.length; i++) {
    r = my.table[i];
    for (j = 0; j < r.length; j++) {
      eq = r[j];
      runningSum += eq.getProb();
      if (runningSum > randProb) {
        foundQ = true;
        return eq;
      }
      if (foundQ) break;
    }
  }
  return null;
}
function fillQueue() {
  var preva = my.currEqun.a;
  var prevb = my.currEqun.b;
  if (my.queue.length > 0) {
    var eqn = my.queue[my.queue.length - 1];
    preva = eqn.a;
    prevb = eqn.b;
  } else {
    preva = my.currEqun.a;
    prevb = my.currEqun.b;
  }
  var attempt = 0;
  while (my.queue.length < 2 && attempt < 100) {
    var limits = my.game.limits;
    var row = getRandomInt(limits[0], limits[2]) - limits[0];
    var col = getRandomInt(limits[1], limits[3]) - limits[1];
    var eq = my.table[row][col];
    eq = getAutoQuestion();
    if (eq.a == preva && eq.b == prevb) {
    } else {
      my.queue.push(eq);
      preva = eq.a;
      prevb = eq.b;
    }
    attempt++;
  }
  document.getElementById("queue").innerHTML = fmtQueue();
}
function fmtQueue() {
  var s = "";
  for (var i = 0; i < my.queue.length; i++) {
    var obj = my.queue[i];
    s += obj.getQ();
    s += "<br/>";
  }
  return s;
}
function checkKeyPressed(ev) {
  var keyCode = ev.keyCode;
  if (keyCode >= 96 && keyCode <= 105) {
    doKey((keyCode - 96).toString());
    ev.preventDefault();
  }
  if (keyCode >= 48 && keyCode <= 57) {
    doKey((keyCode - 48).toString());
    ev.preventDefault();
  }
  if (keyCode == 8 || keyCode == 46) {
    if (my.ans.length > 0) {
      my.ans = my.ans.substr(0, my.ans.length - 1);
      document.getElementById("currA").innerHTML = my.ans;
    }
    ev.preventDefault();
  }
  if (keyCode == 9 || keyCode == 13 || keyCode == 32 || keyCode == 110) {
    ev.preventDefault();
  }
  if (my.isGameOver) {
    my.ans = "";
  }
}
function doKey(c) {
  if (c.charCodeAt(0) == 8592) {
    my.ans = my.ans.substring(0, my.ans.length - 1);
    document.getElementById("currA").innerHTML = my.ans;
  } else {
    my.ans += c;
    document.getElementById("currA").innerHTML = my.ans;
    my.ctimer.more(0.5);
    check();
  }
}
function check() {
  if (my.isGameOver) return;
  if (my.isGamePaused) return;
  var correctAns = my.currEqun.getAnswer();
  if (my.ans.length < correctAns.length) return;
  if (my.ans.length > correctAns.length) return;
  setTimeout(check2, 50);
  fillQueue();
}
function check2() {
  var correctAns = my.currEqun.getAnswer();
  var rightQ = false;
  if (my.ans == correctAns) {
    rightQ = true;
  }
  if (my.timeoutQ) {
    rightQ = false;
  }
  var hist = "";
  my.ansNum++;
  if (rightQ) {
    if (my.soundQ) document.getElementById("sndyes").play();
    my.rightNum++;
    hist += '<span style="color:blue; vertical-align: top;">';
    hist += my.currEqun.getQ() + " " + my.currEqun.getAnswer();
    hist += "</span>";
    hist += '<span style="color:#b94;position:relative; top:-4px;">';
    hist += " &#x2714;";
    hist += "</span>";
    my.currEqun.addHist(1);
  } else {
    if (my.soundQ) document.getElementById("sndno").play();
    hist += '<span style="color:green;  vertical-align:top;">';
    hist += my.currEqun.getQ() + " ";
    hist += "</span>";
    hist += '<span style="color:green; ">';
    hist += " " + my.currEqun.getAnswer();
    hist += "</span>";
    if (my.ans.length > 0) {
      hist += " ";
      hist +=
        '<span style="color:red; background: linear-gradient(to bottom, rgba(255,0,0,0) 42%,rgba(255,0,0,0.5) 47%, rgba(255,0,0,0.5) 53%, rgba(255,0,0,0) 58%); padding: 0 3px 0 3px; border-radius: 3px; ">';
      hist += my.ans;
      hist += "</span>";
    }
    my.queue.unshift(my.currEqun);
    my.currEqun.addHist(0);
  }
  my.hists.push(hist);
  my.prevRightQ = rightQ;
  my.equns.setEqun(my.currEqun);
  var s = "";
  for (var i = my.hists.length - 4; i < my.hists.length; i++) {
    s += '<div style="height:25px;">';
    if (i >= 0) {
      s += my.hists[i];
    }
    s += "</div>";
  }
  document.getElementById("ansNum").innerHTML = my.ansNum.toString();
  document.getElementById("rightNum").innerHTML = my.rightNum.toString();
  document.getElementById("rightPct").innerHTML =
    Math.round((100 * my.rightNum) / my.ansNum) + "%";
  document.getElementById("hist").innerHTML = s;
  if (rightQ) {
    newQ();
  } else {
    newQ();
  }
}
function doTab1(id) {
  var idNo = Number(id.substr(1));
  for (var i = 0; i < my.tabs.length; i++) {
    var div = document.getElementById("c" + i);
    if (i == idNo) {
      div.style.opacity = 1;
      div.style.zIndex = "2";
    } else {
      div.style.opacity = 0;
      div.style.zIndex = "1";
    }
  }
}
function getTabHTML(tabName) {
  var s = "";
  for (var i = 0; i < my.games.length; i++) {
    var game = my.games[i];
    if (game.tab == tabName) {
      s +=
        '<button id="' +
        game.id +
        '" onclick="newGame(this.id)" style="z-index:22; width:110px; margin:5px; height:40px; line-height:16px;" class="togglebtn" >' +
        game.name +
        "</button>";
    }
  }
  return s;
}
function getTrainerHTML() {
  var s = "";
  s +=
    '<div style="position:relative;  text-align:center; display:block; margin:auto; ">';
  s += '<div  style="position:absolute; right:8%; top:10px; z-index: 22;" >';
  s +=
    '<button id="trainOpts" onclick="my.pop.popup()" style=" " class="togglebtn" >Options</button>';
  my.soundQ = true;
  // s += soundBtnHTML()
  s += "</div>";
  s +=
    '<div id="summary" style="display: inline-block; position: absolute; left: 3%; top: 10px; width: 94%; text-align: center; vertical-align: bottom; border-radius: 10px; font: 18px Arial; color: #ffffff; background-color: #4499ee; box-shadow: 10px 10px 5px 0px rgba(40,40,40,0.75); z-index: 4; " >&nbsp;</div>';
  s +=
    '<div id="v321" style="font: bold 180px Arial; color: rgba(0,0,255,0.5); position:absolute; left:' +
    (w / 2 - 50) +
    'px; top:30px; text-align:center; transition: all linear 2s; z-index: 100;">&nbsp;</div>';
  s +=
    '<div style="position:relative; width:300px; height:102px; color: #0000ff; display:inline-block; border-radius: 10px; text-align: left; ">';
  s +=
    '<div id="hist" style="position:absolute; bottom:0; top:0; width:100%; height:10px; color: #0000ff; text-align: center; vertical-align:bottom; font: 20px Arial;  display:inline-block;">&nbsp;</div>';
  s += "</div>";
  s +=
    '<div id="currBG" style="position:relative; width:330px; height:49px; color: #0000ff; background-color: #eeffee; font: 30px Arial; border: 2px solid #ffdd00; border-radius: 20px; display:block; margin: auto; text-align: left;">';
  s +=
    '<canvas id="cutoffcanvas" style="position:absolute; left: 5px; top:5px; z-index:2; width: 40px; height: 40px;"></canvas>';
  s +=
    '<div id="currQ" style="position:absolute; left: 40px; top:5px; width:150px; height: 40px; color: #0000ff; text-align:right; font: 33px Arial;  display:inline-block; padding: 0; margin: 0;">&nbsp;</div>';
  s +=
    '<div id="currA" style="position:absolute; left: 200px; top:3px; width:66px; height: 40px; color: #0000ff; background-color: #ffffff; text-align:center; font: 33px Arial; display:inline-block; border: 2px solid #000066; border-radius: 10px;">&nbsp;</div>';
  s += "</div>";
  s += "</div>";
  s +=
    '<div id="scorebd" style="position:relative; top:4px; width:260px; height: 60px; color: #ffffff;  text-align: center; font: 25px Arial;  display:block; z-index:3; margin: 10px auto 10px auto; ">';
  s +=
    '<canvas id="timercanvas" width="100" height="100" style="z-index:2; position: absolute; top: 0; left: 0; width:100px;"></canvas>';
  s +=
    '<div id="ansNum" style="position:absolute; left:70px; top:20px; width:50px; color: #ffffff; background-color: #7799dd; text-align:center; font: 20px Arial; display:inline-block; border: 1px solid #000088; border-radius: 10px;">&nbsp;</div>';
  s +=
    '<div id="rightNum" style="position:absolute; left:130px; top:20px; width:50px; color: #ffffff; background-color: #7799dd; text-align:center; font: 20px Arial; display:inline-block; border: 1px solid #000088; border-radius: 10px;">&nbsp;</div>';
  s +=
    '<div id="rightPct" style="position:absolute; left:190px; top:20px; width:60px; color: #ffffff; background-color: #7799dd; text-align:center; font: 20px Arial; display:inline-block; border: 1px solid #000088; border-radius: 10px;">&nbsp;</div>';
  s += "</div>";
  s +=
    '<div id="keybd" style="display:block; position:relative; top:4px; width:280px; color: #ffffff; background-color: #7799dd; margin:auto; text-align: center; font: 25px Arial;  border-radius: 5px; z-index:3; border: 1px solid blue;">';
  s += getKeyBdHTML();
  s += "</div>";
  s +=
    '<div id="queue" style="position:absolute; left:60px; top:300px; width:400px; color: #ffffff; background-color: #bb9922; text-align: center; vertical-align:bottom; font: 18px Arial;  display:inline-block; border: 2px solid black; border-radius: 10px; visibility: hidden; ">abc</div>';
  s +=
    '<div id="table" style="margin: 15px auto 10px auto;  width:100%; height:30px; font: 12px Arial;">';
  s += "</div>";
  return s;
}
function getDropdownHTML(opts, funcName, id) {
  var s = "";
  s +=
    '<select id="' +
    id +
    '" style="font: 16px Arial; color: #6600cc; background: rgba(200,220,256,0.7); padding: 1px;line-height:30px;">';
  for (var i = 0; i < opts.length; i++) {
    var idStr = id + i;
    var chkStr = i == 99 ? "checked" : "";
    s +=
      '<option id="' +
      idStr +
      '" value="' +
      opts[i][0] +
      '" style="height:21px;" ' +
      chkStr +
      " >" +
      opts[i][0] +
      "</option>";
  }
  s += "</select>";
  return s;
}
function getKeyBdHTML() {
  var keyss = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    ["&#8592;", "0"],
  ];
  var s = "";
  for (var i = 0; i < keyss.length; i++) {
    var keys = keyss[i];
    s += '<div style="text-align:center;">';
    for (var j = 0; j < keys.length; j++) {
      var key = keys[j];
      s +=
        '<button type="button" class="togglebtn" style="width:30%; margin:1%; padding: 3% 0 3% 0; border-radius:4px; color:#777; border:0; font: 30px Consolas; cursor: pointer;" onclick="keybdClick(&quot;' +
        key +
        '&quot;)">' +
        key +
        "</button>";
    }
    s += "</div>";
  }
  return s;
}
function keybdClick(c) {
  doKey(c);
}
function loadGames() {
  my.games = [];

  addGame("add-row-2", ["Add by 2", "+", [2, 1, 2, 10], "Add"]);
  addGame("add-row-3", ["Add by 3", "+", [3, 1, 3, 10], "Add"]);
  addGame("add-row-4", ["Add by 4", "+", [4, 1, 4, 10], "Add"]);
  addGame("add-row-5", ["Add by 5", "+", [5, 1, 5, 10], "Add"]);
  addGame("add-row-6", ["Add by 6", "+", [6, 1, 6, 10], "Add"]);
  addGame("add-row-7", ["Add by 7", "+", [7, 1, 7, 10], "Add"]);
  addGame("add-row-8", ["Add by 8", "+", [8, 1, 8, 10], "Add"]);
  addGame("add-row-9", ["Add by 9", "+", [9, 1, 9, 10], "Add"]);
  addGame("add-diagnostic-10x10", ["10 x 10", "+", [1, 1, 10, 10], "Add"]);
  addGame("add-doubles", ["Double Digits", "+", [10, 10, 49, 49], "Add"]); // How to show just 1's digit in the matrix? TODO: Re-write
  //   addGame("add-decimals", ["Decimals", "+", [9, 1, 9, 10], "Add"]);

  //   addGame("sub-10-pairs", ["Learn Your 10s", "-", [10, 1, 10, 9], "Subtract"]);
  addGame("sub-col-2", ["Subtract by 2", "-", [10, 2, 19, 2], "Subtract"]);
  addGame("sub-col-3", ["Subtract by 3", "-", [10, 3, 19, 3], "Subtract"]);
  addGame("sub-col-4", ["Subtract by 4", "-", [10, 4, 19, 4], "Subtract"]);
  addGame("sub-col-5", ["Subtract by 5", "-", [10, 5, 19, 5], "Subtract"]);
  addGame("sub-col-6", ["Subtract by 6", "-", [10, 6, 19, 6], "Subtract"]);
  addGame("sub-col-7", ["Subtract by 7", "-", [10, 7, 19, 7], "Subtract"]);
  addGame("sub-col-8", ["Subtract by 8", "-", [10, 8, 19, 8], "Subtract"]);
  addGame("sub-col-9", ["Subtract by 9", "-", [10, 9, 19, 9], "Subtract"]);
  addGame("sub-diagnostic", ["10 x 10", "-", [10, 1, 19, 10], "Subtract"]);
  addGame("sub-doubles", ["Double Digits", "-", [30, 11, 59, 30], "Subtract"]);
  //   addGame("sub-decimals", ["Decimals", "-", [9, 1, 9, 10], "Subtract"]);

  addGame("mult-row-2", ["Multiply by 2", "*", [2, 2, 2, 10], "Multiply"]);
  addGame("mult-row-3", ["Multiply by 3", "*", [3, 2, 3, 10], "Multiply"]);
  addGame("mult-row-4", ["Multiply by 4", "*", [4, 2, 4, 10], "Multiply"]);
  addGame("mult-row-5", ["Multiply by 5", "*", [5, 2, 5, 10], "Multiply"]);
  addGame("mult-row-6", ["Multiply by 6", "*", [6, 2, 6, 10], "Multiply"]);
  addGame("mult-row-7", ["Multiply by 7", "*", [7, 2, 7, 10], "Multiply"]);
  addGame("mult-row-8", ["Multiply by 8", "*", [8, 2, 8, 10], "Multiply"]);
  addGame("mult-row-9", ["Multiply by 9", "*", [9, 2, 9, 10], "Multiply"]);
  addGame("mult-10", ["10 x 10", "*", [2, 2, 10, 10], "Multiply"]);

  addGame("div-2", ["Divide by 2", "/", [2, 2, 10, 2], "Divide"]);
  addGame("div-3", ["Divide by 3", "/", [2, 3, 10, 3], "Divide"]);
  addGame("div-4", ["Divide by 4", "/", [2, 4, 10, 4], "Divide"]);
  addGame("div-5", ["Divide by 5", "/", [2, 5, 10, 5], "Divide"]);
  addGame("div-6", ["Divide by 6", "/", [2, 6, 10, 6], "Divide"]);
  addGame("div-7", ["Divide by 7", "/", [2, 7, 10, 7], "Divide"]);
  addGame("div-8", ["Divide by 8", "/", [2, 8, 10, 8], "Divide"]);
  addGame("div-9", ["Divide by 9", "/", [2, 9, 10, 9], "Divide"]);
  addGame("div-2-9", ["10 x 10", "/", [2, 2, 10, 10], "Divide"]);
}
function addGame(gameID, opts) {
  my.games.push({
    id: gameID,
    name: opts[0],
    ops: opts[1],
    limits: opts[2],
    tab: opts[3],
  });
}
function Equn() {
  this.op = "*";
  this.a = 4;
  this.b = 5;
  this.qStr = "?";
  this.answer = 0;
  this.negativeNumbers = false;
  this.hist = [];
  this.rights = [
    "0",
    "1",
    "00",
    "01",
    "10",
    "11",
    "000",
    "001",
    "010",
    "011",
    "100",
    "101",
    "110",
    "111",
    "0000",
    "0001",
    "0010",
    "0011",
    "0100",
    "0101",
    "0110",
    "0111",
    "1000",
    "1001",
    "1010",
    "1011",
    "1100",
    "1101",
    "1110",
    "1111",
    "00000",
    "00001",
    "00010",
    "00011",
    "00100",
    "00101",
    "00110",
    "00111",
    "01000",
    "01001",
    "01010",
    "01011",
    "01100",
    "01101",
    "01110",
    "01111",
    "10000",
    "10001",
    "10010",
    "10011",
    "10100",
    "10101",
    "10110",
    "10111",
    "11000",
    "11001",
    "11010",
    "11011",
    "11100",
    "11101",
    "11110",
    "11111",
  ];
}
Equn.prototype.getCode = function () {
  var s = "";
  s += num2Base64(this.a);
  s += num2Base64(this.b);
  s += num2Base64(this.getHistCode());
  return s;
};
Equn.prototype.getElapsed = function () {
  return 0;
};
Equn.prototype.getHistCode = function () {
  return this.rights.indexOf(this.getHistString());
};
Equn.prototype.setFromHistCode = function (n) {
  var hs = this.rights[n];
  for (var i = 0; i < hs.length; i++) {
    var h = Number(hs.substr(i, 1));
    if (h == 0 || h == 1) {
      this.hist[i] = h;
    }
  }
};
Equn.prototype.getHistString = function () {
  var h = "";
  if (this.hist.length > 0) {
    var lastFew = Math.min(5, this.hist.length);
    for (var i = this.hist.length - lastFew; i < this.hist.length; i++) {
      h += this.hist[i];
    }
    return h;
  } else {
    return "0";
  }
};
Equn.prototype.getPct = function () {
  return Math.round(this.getRatio() * 100);
};
Equn.prototype.getClr = function () {
  var p = this.getRatio();
  if (this.hist.length < 1) return "transparent";
  if (p < 0.3) return "rgba(200,0,0,0.4)";
  if (p < 0.6) return "rgba(100,100,0,0.3)";
  if (p < 0.9) return "rgba(240,240,100,0.2)";
  else return "rgba(240,240,0,0.5)";
};
Equn.prototype.getRatio = function () {
  var h = ":";
  if (this.hist.length > 0) {
    var lastFew = Math.min(5, this.hist.length);
    var rightNum = 0;
    for (var i = this.hist.length - lastFew; i < this.hist.length; i++) {
      h += this.hist[i];
      if (this.hist[i] == 1) rightNum++;
    }
    return rightNum / lastFew;
  } else {
    return 0;
  }
};
Equn.prototype.getProb = function () {
  if (this.calculate(this.op, this.aChgd(), this.bChgd(), "makeQ") == -32768)
    return 0;
  switch (this.hist.length) {
    case 0:
      return 200;
    case 1:
      return 50;
  }
  var prob = 4;
  for (var i = 0; i < this.hist.length; i++) {
    prob *= 0.6;
    if (this.hist[i] == 0) {
      prob += 50;
    }
  }
  return prob;
};
Equn.prototype.addHist = function (h) {
  this.hist.push(h);
};
Equn.prototype.getQ = function () {
  return this.qStr;
};
Equn.prototype.getAnswer = function () {
  return this.answer.toString();
};
Equn.prototype.setQ = function (op, a, b) {
  this.op = op;
  this.a = a;
  this.b = b;
  this.finishQ(this.op, this.aChgd(), this.bChgd(), "R");
};
Equn.prototype.makeQ = function (operators, limits, posns) {
  console.log("limits=" + limits, posns);
  this.operators = operators;
  this.limits = limits;
  this.maxVal = 10;
  this.op = operators.charAt(getRandomInt(0, operators.length - 1));
  if (this.op == "c") posns = "FS";
  var posn = posns.charAt(getRandomInt(0, posns.length - 1));
  this.a = 0;
  this.b = 0;
  do {
    this.a = getRandomInt(limits[0], limits[2]);
    this.b = getRandomInt(limits[1], limits[3]);
    if (this.negativeNumbers) {
      if (Math.random() < 0.5) {
        this.a = -this.a;
      }
      if (Math.random() < 0.5) {
        this.b = -this.b;
      }
    }
    if (this.op == "c") {
      this.b = limits[2] - this.a;
    }
  } while (
    this.calculate(this.op, this.aChgd(), this.bChgd(), "makeQ") == -32768
  );
  console.log("makeQ", this.op, posn, this.a, this.b);
  this.finishQ(this.op, this.aChgd(), this.bChgd(), posn);
};
Equn.prototype.aChgd = function () {
  if (this.op == "/") {
    return this.calculate("*", this.a, this.b, "setQ");
  }
  return this.a;
};
Equn.prototype.bChgd = function () {
  if (this.op == "c") {
    return this.maxVal - this.a;
  }
  return this.b;
};
Equn.prototype.calculate = function (op, a, b, from) {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      if (this.negativeNumbers) {
        return a - b;
      } else {
        if (a - b < 0) {
          return -32768;
        } else {
          return a - b;
        }
      }
      break;
    case "*":
      if (a == 0 || b == 0) {
        return -32768;
      } else {
        return a * b;
      }
      break;
    case "/":
      if (b == 0) {
        return -32768;
      }
      var temp = a / b;
      var temp2 = temp.toString();
      if (temp2.indexOf(".") > -1) {
        return -32768;
      } else {
        if (this.negativeNumbers) {
          return a / b;
        } else {
          if (temp < 0) {
            return -32768;
          } else {
            return a / b;
          }
        }
      }
      break;
    case "c":
      return a + b;
  }
  return 0;
};
Equn.prototype.finishQ = function (op, a, b, posn) {
  var RHS = this.calculate(op, a, b, "finishQ");
  var qStr = "";
  var answer = 0;
  switch (posn) {
    case "F":
      qStr = "MM" + " " + op + " " + b + " = " + RHS;
      answer = a;
      break;
    case "S":
      qStr = a + " " + op + " " + "MM" + " = " + RHS;
      answer = b;
      break;
    case "R":
      qStr = a + " " + op + " " + b + " = " + "MM";
      answer = RHS;
      break;
  }
  qStr = qStr.replace("*", "×");
  qStr = qStr.replace("c", "+");
  qStr = qStr.replace("MM", "");
  this.qStr = qStr;
  this.answer = answer;
};
function Timer(g, rad, secs, clr, funcEnd) {
  this.g = g;
  this.rad = rad;
  this.secs = secs;
  this.clr = clr;
  this.funcEnd = funcEnd;
  this.x = rad;
  this.y = rad;
  this.stt = performance.now();
  this.stopQ = false;
}
Timer.prototype.update = function () {};
Timer.prototype.restart = function (secs) {
  this.secs = secs;
  this.stt = performance.now();
  this.stopQ = false;
  requestAnimationFrame(this.draw.bind(this));
};
Timer.prototype.more = function (secs) {
  this.stt += secs * 1000;
};
Timer.prototype.stop = function () {
  this.stopQ = true;
};
Timer.prototype.draw = function () {
  if (this.stopQ) return;
  var now = performance.now();
  var elapsed = now - this.stt;
  var ratio = Math.min(1, elapsed / this.secs / 1000);
  var g = this.g;
  g.beginPath();
  g.fillStyle = "#ffffff";
  g.arc(this.x, this.y, this.rad, 0, 2 * Math.PI);
  g.fill();
  g.beginPath();
  g.moveTo(this.x, this.y);
  g.fillStyle = this.clr;
  g.arc(
    this.x,
    this.y,
    this.rad,
    -Math.PI / 2,
    ratio * 2 * Math.PI - Math.PI / 2
  );
  g.fill();
  if (ratio < 1) {
    requestAnimationFrame(this.draw.bind(this));
  } else {
    this.funcEnd();
  }
};
function Equns() {
  this.eqs = {};
}
Equns.prototype.setHist = function (toEq) {
  var op = toEq.op;
  var a = toEq.a;
  var b = toEq.b;
  if (op in this.eqs) {
    var ab = a + "_" + b;
    if (ab in this.eqs[op]) {
      toEq.hist = this.eqs[op][ab].hist;
    }
  }
};
Equns.prototype.setEqun = function (fromEq) {
  var op = fromEq.op;
  var a = fromEq.a;
  var b = fromEq.b;
  if (!(op in this.eqs)) {
    this.eqs[op] = {};
  }
  var ab = a + "_" + b;
  this.eqs[op][ab] = fromEq;
};
Equns.prototype.getDBString = function () {
  var s = "02";
  for (var op in this.eqs) {
    s += "__" + op;
    for (var ab in this.eqs[op]) {
      s += this.eqs[op][ab].getCode();
    }
  }
  return s;
};
Equns.prototype.useDBString = function (s) {
  var ver = s.substr(0, 2);
  if (ver != "02") return "";
  s = s.substr(2);
  var chunks = [];
  for (var i = 0, sLength = s.length; i < sLength; i += 3) {
    chunks.push(s.substring(i, i + 3));
  }
  var op = "?";
  for (i = 0; i < chunks.length; i++) {
    var chunk = chunks[i];
    if (chunk.substr(0, 2) == "__") {
      op = chunk.substr(2, 1);
    } else {
      var a = base642num(chunk.substr(0, 1));
      var b = base642num(chunk.substr(1, 1));
      var histCode = base642num(chunk.substr(2, 1));
      var eq = new Equn();
      eq.op = op;
      eq.a = a;
      eq.b = b;
      eq.setFromHistCode(histCode);
      this.setEqun(eq);
    }
  }
};
function Games(opts) {
  this.opts = opts;
  this.games = {};
  this.game = [];
}
Games.prototype.add = function (name, vs) {
  this.games[name.toString()] = vs;
};
Games.prototype.setGame = function (name) {
  this.game = this.games[name.toString()];
};
Games.prototype.option = function (opt) {
  var n = this.opts.indexOf(opt);
  return this.game[n];
};
function Pop(name, wd) {
  this.name = name;
  this.wd = wd;
  this.id = "pop" + this.name;
}
Pop.prototype.popup = function () {
  var pop = document.getElementById(this.id);
  pop.style.transitionDuration = "0.3s";
  pop.style.opacity = 1;
  pop.style.visibility = "visible";
  pop.style.zIndex = 12;
  pop.style.left = "10px";
};
Pop.prototype.yes = function () {
  var pop = document.getElementById(this.id);
  pop.style.visibility = "hidden";
  pop.style.zIndex = 1;
  pop.style.left = "-500px";
};
Pop.prototype.no = function () {
  console.log("optNo");
  var pop = document.getElementById(this.id);
  pop.style.visibility = "hidden";
  pop.style.zIndex = 1;
  pop.style.left = "-500px";
};
Pop.prototype.getPopHTML = function (inStr) {
  var s = "";
  s +=
    '<div id="' +
    this.id +
    '" style="position:absolute; left:-450px; top:10px; width:' +
    this.wd +
    'px; padding: 5px; border-radius: 9px; background-color: #88aaff; box-shadow: 10px 10px 5px 0px rgba(40,40,40,0.75); transition: all linear 0.3s; opacity:0; text-align: center; ">';
  s += inStr;
  s += '<div style="float:right; margin: 0 0 5px 10px;">';
  s +=
    '<button onclick="' +
    this.name +
    '.no()" style="z-index:2; font: 22px Arial;" class="togglebtn" >&#x2718;</button>';
  s += "</div>";
  s += "</div>";
  return s;
};
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomFloat(min, max) {
  //   return Math.random() * (max - min) + min;
  // Rounds to nearest .1 decimal
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}
function getKeyStr() {
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_:";
}
function num2Base64(n) {
  if (n > 64) n = 64;
  return getKeyStr().charAt(n);
}
function base642num(s) {
  var n = getKeyStr().indexOf(s);
  if (n < 0) n = 0;
  return n;
}
function fmtTime(t) {
  var s = "";
  if (t < 60) {
    s = t + " sec";
    if (t > 1) s += "s";
  } else {
    var ss = t % 60;
    var mm = (t / 60) << 0;
    if (ss == 0) {
      s = mm + " min";
      if (mm > 1) s += "s";
    } else {
      s = mm + "m " + ss + "s";
    }
  }
  return s;
}
var createCookie = function (name, value, days) {
  localStorage.setItem(name, value);
  if (true) {
    var expires;
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toGMTString();
    } else {
      expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
  }
};
function getCookie(c_name) {
  if (false) {
    return localStorage.getItem(c_name);
  } else {
    if (document.cookie.length > 0) {
      var c_start = document.cookie.indexOf(c_name + "=");
      if (c_start != -1) {
        c_start = c_start + c_name.length + 1;
        var c_end = document.cookie.indexOf(";", c_start);
        if (c_end == -1) {
          c_end = document.cookie.length;
        }
        return decodeURIComponent(document.cookie.substring(c_start, c_end));
      }
    }
    return "";
  }
}
function soundBtnHTML() {
  s = "";
  s += "<style> ";
  s +=
    " .speaker { height: 30px; width: 30px; position: relative; overflow: hidden; display: inline-block; vertical-align:top; margin-left: 10px; margin-top: -4px; } ";
  s +=
    " .speaker span { display: block; width: 9px; height: 9px; background-color: blue; margin: 10px 0 0 1px; }";
  s +=
    ' .speaker span:after { content: ""; position: absolute; width: 0; height: 0; border-style: solid; border-color: transparent blue transparent transparent; border-width: 10px 16px 10px 15px; left: -13px; top: 5px; }';
  s +=
    ' .speaker span:before { transform: rotate(45deg); border-radius: 0 60px 0 0; content: ""; position: absolute; width: 5px; height: 5px; border-style: double; border-color: blue; border-width: 7px 7px 0 0; left: 18px; top: 9px; transition: all 0.2s ease-out; }';
  s +=
    " .speaker:hover span:before { transform: scale(.8) translate(-3px, 0) rotate(42deg); }";
  s +=
    " .speaker.mute span:before { transform: scale(.5) translate(-15px, 0) rotate(36deg); opacity: 0; }";
  s += " </style>";
  s +=
    '<div id="sound" onClick="soundToggle()" class="speaker"><span></span></div>';
  return s;
}
function soundToggle() {
  var btn = "sound";
  if (my.soundQ) {
    my.soundQ = false;
    document.getElementById(btn).classList.add("mute");
  } else {
    my.soundQ = true;
    document.getElementById(btn).classList.remove("mute");
  }
}
function getJSQueryVar(varName, defaultVal) {
  let scripts = document.getElementsByTagName("script");
  let lastScript = scripts[scripts.length - 1];
  let scriptName = lastScript.src;
  let bits = scriptName.split("?");
  if (bits.length < 2) return defaultVal;
  let query = bits[1];
  console.log("query: ", query);
  let vars = query.split("&");
  for (let i = 0; i < vars.length; i++) {
    let pair = vars[i].split("=");
    if (pair[0] == varName) {
      return pair[1];
    }
  }
  return defaultVal;
}
function docInsert(s) {
  let div = document.createElement("div");
  div.innerHTML = s;
  let script = document.currentScript;
  script.parentElement.insertBefore(div, script);
}
function wrap(
  {
    id = "",
    cls = "",
    pos = "rel",
    style = "",
    txt = "",
    tag = "div",
    lbl = "",
    fn = "",
    opts = [],
  },
  ...mores
) {
  let s = "";
  s += "\n";
  txt += mores.join("");
  let noProp = "event.stopPropagation(); ";
  let tags = {
    btn: {
      stt:
        "<button " + (fn.length > 0 ? ' onclick="' + noProp + fn + '" ' : ""),
      cls: "btn",
      fin: ">" + txt + "</button>",
    },
    can: {
      stt: "<canvas ",
      cls: "",
      fin: "></canvas>",
    },
    div: {
      stt: "<div " + (fn.length > 0 ? ' onclick="' + fn + '" ' : ""),
      cls: "",
      fin: " >" + txt + "</div>",
    },
    edit: {
      stt: '<textarea onkeyup="' + fn + '" onchange="' + fn + '"',
      cls: "",
      fin: " >" + txt + "</textarea>",
    },
    inp: {
      stt:
        '<input value="' +
        txt +
        '"' +
        (fn.length > 0 ? '  oninput="' + fn + '" onchange="' + fn + '"' : ""),
      cls: "input",
      fin: ">" + (lbl.length > 0 ? "</label>" : ""),
    },
    out: {
      stt: "<span ",
      cls: "output",
      fin: " >" + txt + "</span>" + (lbl.length > 0 ? "</label>" : ""),
    },
    radio: {
      stt: "<div ",
      cls: "radio",
      fin: ">\n",
    },
    sel: {
      stt: "<select " + (fn.length > 0 ? ' onchange="' + fn + '"' : ""),
      cls: "select",
      fin: ">\n",
    },
    sld: {
      stt:
        '<input type="range" ' +
        txt +
        ' oninput="' +
        noProp +
        fn +
        '" onchange="' +
        noProp +
        fn +
        '"',
      cls: "select",
      fin: ">" + (lbl.length > 0 ? "</label>" : ""),
    },
  };
  let type = tags[tag];
  if (lbl.length > 0) s += '<label class="label">' + lbl + " ";
  s += type.stt;
  if (cls.length == 0) cls = type.cls;
  if (tag == "div") style += fn.length > 0 ? " cursor:pointer;" : "";
  if (id.length > 0) s += ' id="' + id + '"';
  if (cls.length > 0) s += ' class="' + cls + '"';
  if (pos == "dib")
    s += ' style="position:relative; display:inline-block;' + style + '"';
  if (pos == "rel") s += ' style="position:relative; ' + style + '"';
  if (pos == "abs") s += ' style="position:absolute; ' + style + '"';
  s += type.fin;
  if (tag == "radio") {
    for (let i = 0; i < opts.length; i++) {
      let chk = "";
      if (i == 0) chk = "checked";
      let idi = id + i;
      let lbl = opts[i];
      s +=
        '<input id="' +
        idi +
        '" type="radio" name="' +
        id +
        '" value="' +
        lbl.name +
        '" onclick="' +
        fn +
        "(" +
        i +
        ');" ' +
        chk +
        " >";
      s += '<label for="' + idi + '">' + lbl.name + " </label>";
    }
    s += "</div>";
  }
  if (tag == "sel") {
    for (let i = 0; i < opts.length; i++) {
      let opt = opts[i];
      let idStr = id + i;
      let chkStr = opt.name == txt ? " selected " : "";
      let descr = opt.hasOwnProperty("descr") ? opt.descr : opt.name;
      s +=
        '<option id="' +
        idStr +
        '" value="' +
        opt.name +
        '"' +
        chkStr +
        ">" +
        descr +
        "</option>\n";
    }
    s += "</select>";
    if (lbl.length > 0) s += "</label>";
  }
  s += "\n";
  return s.trim();
}
init();
