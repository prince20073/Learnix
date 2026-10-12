// Learnix Teacher Studio — interactive front-end prototype. Uses browser storage only.
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
let session = window.Learnix?.Session.requireRole("teacher") || null;
if (!session) { try { session = JSON.parse(localStorage.getItem("learnix_demo_session") || "null"); } catch {} }
const currentTeacher = session ? new Learnix.Teacher(session) : null;
if (!session || session.role !== "teacher") {
  // Avoid interrupting local file previews when no demo session exists, but keep login route available.
  if (location.protocol !== "file:") location.replace("index.html");
}
const displayName = (session?.name || "Teacher").trim();
const firstName = displayName.split(/\s+/)[0] || "Teacher";
$("#greeting").innerHTML = `${greet()}, ${escapeHtml(firstName)} <span>✦</span>`;
$("#side-name").textContent = displayName;
$("#side-avatar").textContent = firstName.slice(0,1).toUpperCase();
$("#top-avatar").textContent = firstName.slice(0,1).toUpperCase();
const now = new Date();
$("#today-label").textContent = now.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}).toUpperCase() + " · YOUR TEACHING WORKSPACE";
const teacherAccountKey = (session?.email || "guest").trim().toLowerCase().replace(/[^a-z0-9@._-]/g, "_");
const storeKey = `learnix_teacher_assignments_${teacherAccountKey}`;
const settingsKey = `learnix_teacher_settings_${teacherAccountKey}`;
const profileKey = `learnix_teacher_profile_${teacherAccountKey}`;
let assignments = window.Learnix ? Learnix.AssignmentRepository.all(storeKey) : readStore(storeKey, []);
let cloudCourses = [];
let profile = readStore(profileKey, {name:displayName,email:session?.email||"",department:session?.department||"Computer Science",title:"Faculty / Instructor",employeeId:"LX-T-1001",phone:"",office:"",bio:"I help students build confidence through clear explanations, practice, and feedback.",photo:""});
let settings = readStore(settingsKey, {theme:"light",emailAlerts:true,deadlineAlerts:true,weeklySummary:false,submissionAlerts:true,studentSupportAlerts:true,compactMode:false});
if(settings.theme==="dark") document.body.classList.add("theme-dark");
if(settings.compactMode) document.body.classList.add("compact-mode");
if(profile.photo){const topAvatar=document.getElementById("top-avatar");if(topAvatar){topAvatar.innerHTML=`<img src="${profile.photo}" alt="Profile photo">`;}}
let toastTimer;
function readStore(key, fallback){try{const x=JSON.parse(localStorage.getItem(key));return x ?? fallback}catch{return fallback}}
function saveStore(key,value){localStorage.setItem(key,JSON.stringify(value))}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function showToast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2800)}
function setView(key, scroll=true){
  const titles={overview:"Overview",classes:"My classes",students:"Student directory",assignments:"Assignments",grading:"Grading & feedback",attendance:"Attendance",insights:"Learning insights",support:"Early support",schedule:"Teaching schedule",resources:"Class resources",profile:"My profile",settings:"Settings"};
  $$(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===key));
  $("#crumb").textContent=titles[key]||"Overview";
  if(key==="overview"){ $("#workspace-title").textContent="Teaching tools";$("#workspace-subtitle").textContent="Choose a workspace section to manage your classroom.";renderTiles([["✎","Useful feedback","Make feedback specific, kind, and actionable."],["⌁","Look for patterns","Combine signals before deciding what support is needed."],["✦","Celebrate growth","Recognise improvement as well as achievement."]]);}
  else renderWorkspace(key);
  if(scroll) $("#workspace-panel").scrollIntoView({behavior:"smooth",block:"start"});
  $("#sidebar").classList.remove("open");
}
const classNames=["Data Structures · CSE 3A","Database Systems · CSE 3A","Java OOP Lab · CSE 3B"];
const demoStudents=[
 {name:"Aarav Mehta",id:"LX-2301",course:"Data Structures",attendance:92,score:84,status:"On track"},
 {name:"Ananya Singh",id:"LX-2302",course:"Data Structures",attendance:68,score:61,status:"Check in"},
 {name:"Rohan Verma",id:"LX-2303",course:"Database Systems",attendance:88,score:77,status:"On track"},
 {name:"Ishita Sharma",id:"LX-2304",course:"Java OOP Lab",attendance:74,score:69,status:"Check in"},
 {name:"Kabir Das",id:"LX-2305",course:"Database Systems",attendance:96,score:91,status:"Improving"},
 {name:"Meera Patel",id:"LX-2306",course:"Java OOP Lab",attendance:81,score:86,status:"On track"}
];
function renderTiles(items){$("#workspace-content").className="tool-grid";$("#workspace-content").innerHTML=items.map(x=>`<div class="tool-tile"><span>${x[0]}</span><b>${escapeHtml(x[1])}</b><p>${escapeHtml(x[2])}</p></div>`).join("")}
function renderWorkspace(key){
 const box=$("#workspace-content");box.className=""; 
 const set=(title,sub,html)=>{$("#workspace-title").textContent=title;$("#workspace-subtitle").textContent=sub;box.innerHTML=html;};
 if(key==="classes"){
  set("My classes","Your current teaching groups and course progress.",`<div class="section-toolbar"><button class="primary-button" id="add-cloud-course">＋ Add course to shared workspace</button><button class="action-button" id="enroll-cloud-student">＋ Enrol student by email</button></div><div class="tool-grid">${[
   ["DS","Data Structures · CSE 3A","42 students · 74% course progress","Next: Practice set review"],
   ["DB","Database Systems · CSE 3A","38 students · 68% course progress","Next: Mini project"],
   ["JV","Java OOP Lab · CSE 3B","26 students · 81% course progress","Next: Lab reflection"],
   ["CS","Computer Science Seminar","22 students · 57% course progress","Next: Weekly discussion"]
  ].map((x,i)=>`<div class="tool-tile"><span>${x[0]}</span><b>${x[1]}</b><p>${x[2]}<br>${x[3]}</p><button class="action-button" data-class-detail="${i}">Open class details</button></div>`).join("")}</div>`);
  $$("[data-class-detail]",box).forEach(b=>b.onclick=()=>showToast(`${["Data Structures","Database Systems","Java OOP Lab","Computer Science Seminar"][+b.dataset.classDetail]} class selected · Demo view`));
  const addCourse=$("#add-cloud-course"); if(addCourse) addCourse.onclick=async()=>{if(!window.LearnixBackend?.enabled){showToast("Configure Supabase to create a shared course.");return;}const title=prompt("Course title (e.g. Data Structures)");if(!title?.trim())return;const code=prompt("Course code (e.g. CSE301)");if(!code?.trim())return;const semester=prompt("Semester (optional, e.g. 3rd semester)")||"";try{await window.LearnixBackend.createCourse({title:title.trim(),code:code.trim().toUpperCase(),semester:semester.trim()});await syncTeacherWorkspace();showToast("Course created in the shared database. Students must be enrolled to see its assignments.");}catch(error){showToast(error.message||"Could not create course.");}};
  const enrollStudent=$("#enroll-cloud-student"); if(enrollStudent) enrollStudent.onclick=async()=>{if(!window.LearnixBackend?.enabled){showToast("Configure Supabase to enrol students.");return;}if(!cloudCourses.length)cloudCourses=await window.LearnixBackend.listMyCourses();if(!cloudCourses.length){showToast("Create a course first.");return;}const email=prompt("Enter the student's registered Learnix email");if(!email?.trim())return;let course=cloudCourses[0];if(cloudCourses.length>1){const title=prompt("Enter exact course title to enrol into:\n"+cloudCourses.map(c=>c.title).join("\n"));course=cloudCourses.find(c=>c.title===title);if(!course){showToast("Course title did not match.");return;}}try{await window.LearnixBackend.enrollStudent({courseId:course.id,email:email.trim()});showToast("Student enrolled. They can now see this course's assignments after refreshing their portal.");}catch(error){showToast(error.message||"Could not enrol student.");}};
 }else if(key==="students"){
  set("Student directory","Search the sample class list. Real student records are not connected.",`<input class="inline-search" id="student-search" placeholder="Search by student or course..." aria-label="Search students"><div class="table-scroll"><table class="student-table"><thead><tr><th>Student</th><th>Course</th><th>Attendance</th><th>Latest score</th><th>Signal</th><th></th></tr></thead><tbody id="student-rows"></tbody></table></div>`);
  const draw=(q="")=>{$("#student-rows").innerHTML=demoStudents.filter(s=>(s.name+" "+s.course+" "+s.id).toLowerCase().includes(q.toLowerCase())).map(s=>`<tr><td><b>${s.name}</b><br><small>${s.id}</small></td><td>${s.course}</td><td>${s.attendance}%</td><td>${s.score}%</td><td><span class="table-status" style="${s.status==="On track"||s.status==="Improving"?"background:#e7f8ef;color:#278c70":""}">${s.status}</span></td><td><button class="action-button" data-student="${s.id}">View</button></td></tr>`).join("")||`<tr><td colspan="6" class="empty-state">No students match that search.</td></tr>`;$$("[data-student]",box).forEach(b=>b.onclick=()=>{let s=demoStudents.find(x=>x.id===b.dataset.student);showToast(`${s.name}: ${s.attendance}% attendance · ${s.score}% latest score (sample)`)});};
  draw();$("#student-search").addEventListener("input",e=>draw(e.target.value));
 }else if(key==="assignments"){
  set("Assignments & deadlines","Create work, track due dates, and keep expectations clear.",`<div class="section-toolbar"><button class="primary-button" id="section-create">＋ Create assignment</button></div><div class="table-scroll"><table class="student-table"><thead><tr><th>Assignment</th><th>Class</th><th>Due date</th><th>Submissions</th><th>Status</th></tr></thead><tbody id="assignment-rows"></tbody></table></div>`);
  renderAssignmentRows();$("#section-create").onclick=openModal;
 }else if(key==="grading"){
  set("Grading & feedback","A small demo queue showing how review work can be organised.",`<div class="tool-grid"><div class="tool-tile"><span>12</span><b>Waiting for review</b><p>Practice set submissions from Data Structures.</p><button class="action-button" data-grade="12">Start review queue</button></div><div class="tool-tile"><span>8</span><b>Feedback drafts</b><p>Draft comments waiting to be finalised.</p><button class="action-button" data-grade="8">Continue feedback</button></div><div class="tool-tile"><span>3</span><b>Needs clarification</b><p>Submissions with questions from students.</p><button class="action-button" data-grade="3">Review questions</button></div></div><div class="pulse-note" style="margin-top:16px"><span>✦</span><p><b>Feedback principle</b> Tell students what went well, what to improve, and one practical next step.</p></div>`);
  $$("[data-grade]",box).forEach(b=>b.onclick=openGrading);
 }else if(key==="attendance"){
  set("Attendance register","Mark sample attendance for a selected class. This is not sent to an institution.",`<div class="attendance-controls"><select id="attendance-class">${classNames.map(x=>`<option>${x}</option>`).join("")}</select><input type="date" id="attendance-date" value="${new Date().toISOString().slice(0,10)}"><button class="action-button" id="mark-all">Mark all present</button></div><div class="table-scroll"><table class="student-table"><thead><tr><th>Student</th><th>Present today</th><th>Attendance to date</th></tr></thead><tbody>${demoStudents.slice(0,4).map((s,i)=>`<tr><td><b>${s.name}</b><br><small>${s.id}</small></td><td><input class="attendance-check" type="checkbox" ${i!==1?"checked":""} aria-label="Present for ${s.name}"></td><td>${s.attendance}%</td></tr>`).join("")}</tbody></table></div><div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="primary-button" id="save-attendance">Save demo attendance</button></div>`);
  $("#mark-all").onclick=()=>{$$(".attendance-check",box).forEach(c=>c.checked=true);showToast("All sample students marked present.")};$("#save-attendance").onclick=()=>{const records=$$(".attendance-check",box).map((c,i)=>({student:demoStudents[i]?.id||"",present:c.checked,date:$("#attendance-date").value,className:$("#attendance-class").value}));saveStore("learnix_teacher_attendance",records);showToast(`Saved ${records.filter(r=>r.present).length} present records in this browser.`)};
 }else if(key==="insights"){
  set("Learning insights","Use combined indicators to ask better questions—not to make automatic decisions.",`<div class="tool-grid"><div class="tool-tile"><span>↘</span><b>Changes in performance</b><p>Compare multiple assessments before concluding a student is falling behind.</p><button class="action-button" data-insight="performance">Explore pattern</button></div><div class="tool-tile"><span>◷</span><b>Attendance & participation</b><p>Review recent attendance alongside class activity and student context.</p><button class="action-button" data-insight="attendance">Explore pattern</button></div><div class="tool-tile"><span>✦</span><b>Momentum & consistency</b><p>Notice steady work, assignment completion, and improvement over time.</p><button class="action-button" data-insight="momentum">Explore pattern</button></div></div><div class="pulse-note" style="margin-top:16px"><span>ⓘ</span><p><b>Responsible use</b> Indicators here are illustrative. A real AI system should explain its reasoning, protect privacy, and keep teachers in control.</p></div>`);
  $$("[data-insight]",box).forEach(b=>b.onclick=()=>showToast("Sample insight: review the student's context and speak with them before choosing support."));
 }else if(key==="support"){
  set("Early support","Support prompts should start a conversation, never label a learner.",`<div class="tool-grid"><div class="tool-tile"><span>!</span><b>Attendance follow-up</b><p>Check if barriers such as timetable, commute, or wellbeing are affecting attendance.</p><button class="action-button" data-support="attendance">Plan a check-in</button></div><div class="tool-tile"><span>↘</span><b>Recent performance dip</b><p>Ask what has changed and agree on a small, achievable next step.</p><button class="action-button" data-support="performance">Plan a check-in</button></div><div class="tool-tile"><span>✦</span><b>Progress to celebrate</b><p>Recognise effort, improvement, and persistence with specific feedback.</p><button class="action-button" data-support="celebrate">Write recognition</button></div></div>`);
  $$("[data-support]",box).forEach(b=>b.onclick=()=>{const prompts={attendance:"Hi, I wanted to check in and see whether anything is making it difficult to attend regularly. Is there a way I can help?",performance:"I noticed your recent work has felt different from earlier. How are things going, and what would help you with the next topic?",celebrate:"I noticed the effort you have put into improving. Your consistency is making a difference—keep going."};showPrompt(prompts[b.dataset.support]);});
 }else if(key==="schedule"){
  set("Teaching schedule","Example timetable for planning your teaching day.",`<div class="tool-grid">${[["09:00 AM","Data Structures","Room B-204 · CSE 3A","Completed"],["11:30 AM","Database Systems","Room A-108 · CSE 3A","Next session"],["02:00 PM","Java OOP Lab","Lab 2 · CSE 3B","Later today"],["04:00 PM","Student office hours","Faculty workspace","Optional"]].map(x=>`<div class="tool-tile"><span>◷</span><b>${x[0]} · ${x[1]}</b><p>${x[2]}<br><strong>${x[3]}</strong></p></div>`).join("")}</div>`);
 }else if(key==="resources"){
  const resources=readStore("learnix_teacher_resources",[]);
  set("Class resources","Save teaching links and reference material in this browser.",`<div class="tool-grid"><div class="tool-tile"><span>▧</span><b>Lecture materials</b><p>Slides, notes, and reading links for your courses.</p><button class="action-button" data-resource="Lecture material">＋ Add resource</button></div><div class="tool-tile"><span>☑</span><b>Practice materials</b><p>Exercises, sample questions, and lab sheets.</p><button class="action-button" data-resource="Practice material">＋ Add resource</button></div><div class="tool-tile"><span>↗</span><b>Useful links</b><p>Approved reference links for students.</p><button class="action-button" data-resource="Useful link">＋ Add resource</button></div></div><div class="setting-box" style="margin-top:16px"><b>Saved resources (${resources.length})</b>${resources.map(r=>`<p><a href="${escapeHtml(r.url)}" target="_blank" rel="noopener">${escapeHtml(r.title)}</a> · ${escapeHtml(r.category)}</p>`).join("")||"<p>No resources saved yet.</p>"}</div>`);
  $$("[data-resource]",box).forEach(b=>b.onclick=()=>{const title=prompt("Resource title:");if(!title)return;const url=prompt("Resource URL (https://...)");if(!url)return;if(!/^https?:\/\//i.test(url)){showToast("Enter a valid http:// or https:// URL.");return}resources.push({title,url,category:b.dataset.resource,createdAt:new Date().toISOString()});saveStore("learnix_teacher_resources",resources);setView("resources");showToast("Resource saved in this browser.")});
 }else if(key==="profile"){
  set("My profile","Your teaching identity, contact details, and professional information.",`<div class="teacher-profile-hero"><div class="teacher-profile-avatar-wrap"><img id="teacher-profile-photo" src="${profile.photo||"learnix-logo.png"}" alt="Teacher profile photo"><label class="photo-upload-button" for="teacher-photo-input">Change photo</label><input id="teacher-photo-input" type="file" accept="image/*" hidden></div><div class="teacher-profile-identity"><span class="profile-kicker">TEACHER PROFILE</span><h2 id="profile-heading">${escapeHtml(profile.name||displayName)}</h2><p>${escapeHtml(profile.title||"Faculty / Instructor")} · ${escapeHtml(profile.department||"Department not set")}</p><div class="profile-chips"><span>Faculty workspace</span><span>${escapeHtml(profile.employeeId||"Employee ID not set")}</span></div></div><button class="primary-button" id="profile-save-top">Save profile</button></div><form id="teacher-profile-form" class="teacher-profile-form"><section class="profile-section"><h3>Personal information</h3><div class="profile-fields"><label>Full name<input id="profile-name" value="${escapeHtml(profile.name||"")}" required></label><label>Work email<input id="profile-email" type="email" value="${escapeHtml(profile.email||"")}" required></label><label>Phone number<input id="profile-phone" type="tel" value="${escapeHtml(profile.phone||"")}" placeholder="+91 ..."></label><label>Job title<input id="profile-title" value="${escapeHtml(profile.title||"")}" placeholder="Assistant Professor"></label><label>Department<input id="profile-department" value="${escapeHtml(profile.department||"")}" placeholder="Computer Science"></label><label>Employee ID<input id="profile-employee-id" value="${escapeHtml(profile.employeeId||"")}" placeholder="LX-T-1001"></label><label>Office / room<input id="profile-office" value="${escapeHtml(profile.office||"")}" placeholder="Block B, Room 204"></label></div><label class="profile-bio-label">Professional bio<textarea id="profile-bio" rows="4" placeholder="Briefly describe your teaching interests...">${escapeHtml(profile.bio||"")}</textarea></label></section><section class="profile-section"><h3>Teaching snapshot</h3><div class="profile-stats"><div><span>Classes</span><b>4</b><small>Sample workspace</small></div><div><span>Students</span><b>128</b><small>Across demo classes</small></div><div><span>Assignments</span><b>${assignments.length}</b><small>Created in this browser</small></div></div></section><div class="profile-actions"><button class="primary-button" type="submit">Save profile changes</button><button class="action-button" type="button" id="profile-reset">Reset unsaved changes</button></div></form>`);
  $("#teacher-photo-input").onchange=e=>{const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith("image/")){showToast("Please select an image file.");return}if(file.size>2*1024*1024){showToast("Choose an image smaller than 2 MB.");return}const reader=new FileReader();reader.onload=()=>{profile.photo=reader.result;$("#teacher-profile-photo").src=profile.photo;saveStore(profileKey,profile);showToast("Profile photo saved in this browser.")};reader.readAsDataURL(file)};
  const saveProfile=()=>{profile={...profile,name:$("#profile-name").value.trim(),email:$("#profile-email").value.trim(),phone:$("#profile-phone").value.trim(),title:$("#profile-title").value.trim(),department:$("#profile-department").value.trim(),employeeId:$("#profile-employee-id").value.trim(),office:$("#profile-office").value.trim(),bio:$("#profile-bio").value.trim()};saveStore(profileKey,profile);if(session){session.name=profile.name;session.email=profile.email;session.department=profile.department;localStorage.setItem("learnix_demo_session",JSON.stringify(session))}$("#side-name").textContent=profile.name;$("#side-avatar").textContent=(profile.name.split(/\s+/)[0]||"T").slice(0,1).toUpperCase();$("#top-avatar").textContent=$("#side-avatar").textContent;$("#greeting").innerHTML=`${greet()}, ${escapeHtml((profile.name.split(/\s+/)[0]||"Teacher"))} <span>✦</span>`;$("#profile-heading").textContent=profile.name;showToast("Teacher profile saved in this browser.")};
  $("#teacher-profile-form").onsubmit=e=>{e.preventDefault();saveProfile()};
  $("#profile-save-top").onclick=saveProfile;
  $("#profile-reset").onclick=()=>setView("profile");
 }else if(key==="settings"){
  set("Teacher settings","Personalise your teaching workspace, reminders, accessibility, and data preferences.",`<div class="settings-grid"><div class="setting-box"><b>Appearance</b><p>Choose a comfortable look for your workday.</p><select id="theme-select"><option value="light">Light theme</option><option value="dark">Dark theme</option></select><label class="setting-check"><input type="checkbox" id="compact-mode"> Compact dashboard spacing</label></div><div class="setting-box"><b>Notifications & reminders</b><p>Choose which demo alerts you want to see.</p><label><input type="checkbox" id="email-alerts"> Email and feedback reminders</label><label><input type="checkbox" id="deadline-alerts"> Assignment deadline reminders</label><label><input type="checkbox" id="weekly-summary"> Weekly teaching summary</label><label><input type="checkbox" id="submission-alerts"> New submission alerts</label><label><input type="checkbox" id="student-support-alerts"> Student support reminders</label></div><div class="setting-box"><b>Profile & identity</b><p>Manage your teaching details, photo, and professional bio.</p><button class="action-button" id="open-profile">Open my profile</button><button class="action-button" id="edit-display-name">Quick edit display name</button></div><div class="setting-box"><b>Privacy & safety</b><p>This prototype stores demo information in this browser. It is not connected to your institution.</p><label class="setting-check"><input type="checkbox" id="confirm-demo"> Show demo-data reminders</label><button class="action-button danger-action" id="clear-demo-data">Clear demo assignments</button><button class="action-button danger-action" id="reset-teacher-settings">Reset settings</button></div><div class="setting-box"><b>Teaching preferences</b><p>Set your default teaching workspace preferences.</p><label>Default department<input id="pref-department" class="setting-text" placeholder="Computer Science"></label><label>Preferred class size<select id="pref-class-size"><option>Any</option><option>Small (under 25)</option><option>Medium (25–50)</option><option>Large (50+)</option></select></label></div><div class="setting-box"><b>Account</b><p>Signed in as <strong>${escapeHtml(profile.name||displayName)}</strong><br>${escapeHtml(profile.email||session?.email||"")}</p><button class="action-button" id="logout-settings">Sign out</button></div></div>`);
  $("#theme-select").value=settings.theme;$("#email-alerts").checked=settings.emailAlerts;$("#deadline-alerts").checked=settings.deadlineAlerts;$("#weekly-summary").checked=settings.weeklySummary;
  $("#theme-select").onchange=e=>{settings.theme=e.target.value;document.body.classList.toggle("theme-dark",settings.theme==="dark");saveStore(settingsKey,settings);showToast("Theme preference saved.")};
  const settingMap={"email-alerts":"emailAlerts","deadline-alerts":"deadlineAlerts","weekly-summary":"weeklySummary","submission-alerts":"submissionAlerts","student-support-alerts":"studentSupportAlerts","compact-mode":"compactMode"};
  Object.entries(settingMap).forEach(([id,keyName])=>{const el=$("#"+id);if(!el)return;el.checked=!!settings[keyName];el.onchange=e=>{settings[keyName]=e.target.checked;saveStore(settingsKey,settings);document.body.classList.toggle("compact-mode",!!settings.compactMode);showToast("Settings saved in this browser.")}});
  $("#open-profile").onclick=()=>setView("profile");
  $("#logout-settings").onclick=()=>{localStorage.removeItem("learnix_demo_session");location.href="index.html"};
  $("#pref-department").value=settings.defaultDepartment||profile.department||"Computer Science";
  $("#pref-class-size").value=settings.classSize||"Any";
  $("#pref-department").onchange=e=>{settings.defaultDepartment=e.target.value;saveStore(settingsKey,settings);showToast("Teaching preference saved.")};
  $("#pref-class-size").onchange=e=>{settings.classSize=e.target.value;saveStore(settingsKey,settings);showToast("Teaching preference saved.")};
  $("#confirm-demo").checked=settings.showDemoNotice!==false;
  $("#confirm-demo").onchange=e=>{settings.showDemoNotice=e.target.checked;saveStore(settingsKey,settings)};
  $("#reset-teacher-settings").onclick=()=>{if(confirm("Reset teacher workspace settings?")){settings={theme:"light",emailAlerts:true,deadlineAlerts:true,weeklySummary:false,submissionAlerts:true,studentSupportAlerts:true,compactMode:false};saveStore(settingsKey,settings);document.body.classList.remove("theme-dark","compact-mode");setView("settings");showToast("Settings reset.")}};
  $("#clear-demo-data").onclick=()=>{if(confirm("Delete all assignments saved in this browser?")){assignments=[];saveStore(storeKey,assignments);setView("assignments");showToast("Demo assignments cleared.")}};

  $("#edit-display-name").onclick=()=>{const name=prompt("Enter the display name:",displayName);if(name&&name.trim()){if(session){session.name=name.trim();localStorage.setItem("learnix_demo_session",JSON.stringify(session))}$("#side-name").textContent=name.trim();$("#greeting").innerHTML=`${greet()}, ${escapeHtml(name.trim().split(/\s+/)[0])} <span>✦</span>`;showToast("Display name updated for this page. Sign in again if the change does not persist.")}};
  $("#clear-demo-data").onclick=()=>{if(confirm("Delete assignments saved in this browser?")){assignments=[];saveStore(storeKey,assignments);renderAssignmentRows();showToast("Demo assignments cleared.")}};
 }else {setView("overview",false);}
}
function showPrompt(text){const v=prompt("Suggested message — edit or copy it as needed:",text);if(v!==null)showToast("Draft ready. Copy it into your institution's approved messaging tool.");}
async function syncTeacherWorkspace(){
 if(!window.LearnixBackend?.enabled) return;
 try{
   cloudCourses=await window.LearnixBackend.listMyCourses();
   const select=$("#assignment-class");
   if(select && cloudCourses.length){select.innerHTML=cloudCourses.map(c=>`<option value="${escapeHtml(c.id)}">${escapeHtml(c.title)}${c.code?` · ${escapeHtml(c.code)}`:""}</option>`).join("");}
   const remote=await window.LearnixBackend.listMyAssignments();
   assignments=remote.map(a=>({id:a.id,title:a.title,className:a.courses?.title||"Course",due:(a.due_at||"").slice(0,10),instructions:a.description||"",status:"published",cloud:true}));
   renderAssignmentRows();
   const hint=document.querySelector(".form-hint"); if(hint)hint.textContent="Connected mode: assignments publish to the shared database and appear for enrolled students.";
   const notice=document.querySelector(".welcome-strip p"); if(notice)notice.textContent="Connected to Learnix shared workspace. Only assigned classes and authorised records are shown.";
 }catch(error){showToast(`Backend sync issue: ${error.message}`);}
}
function renderAssignmentRows(){
 const tbody=$("#assignment-rows");if(!tbody)return;
 const all=[...assignments].sort((a,b)=>a.due.localeCompare(b.due));
 tbody.innerHTML=all.map(a=>`<tr><td><b>${escapeHtml(a.title)}</b><br><small>${escapeHtml(a.instructions||"No extra instructions")}</small></td><td>${escapeHtml(a.className)}</td><td>${escapeHtml(formatDate(a.due))}</td><td>—</td><td><span class="table-status" style="background:#eeecff;color:#6d61db">Created in demo</span></td></tr>`).join("")||`<tr><td colspan="5" class="empty-state">No assignments created yet. Use “Create assignment” to add one.</td></tr>`;
}
function formatDate(d){if(!d)return "Not set";const date=new Date(d+"T00:00:00");return date.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
function openModal(){const modal=$("#modal-backdrop");modal.hidden=false;$("#assignment-title").focus();const date=new Date();date.setDate(date.getDate()+7);$("#assignment-due").min=new Date().toISOString().slice(0,10);$("#assignment-due").value=date.toISOString().slice(0,10)}
function closeModal(){$("#modal-backdrop").hidden=true;$("#assignment-form").reset()}
$("#create-assignment").addEventListener("click",openModal);$("#modal-close").onclick=closeModal;$("#cancel-modal").onclick=closeModal;$("#modal-backdrop").addEventListener("click",e=>{if(e.target.id==="modal-backdrop")closeModal()});
$("#assignment-form").addEventListener("submit",async e=>{
 e.preventDefault();
 const title=$("#assignment-title").value.trim(), className=$("#assignment-class").value, due=$("#assignment-due").value, instructions=$("#assignment-instructions").value.trim();
 if(!title||!due){showToast("Add an assignment title and due date.");return;}
 if(window.LearnixBackend?.enabled){
   try{
     if(!cloudCourses.length) cloudCourses=await window.LearnixBackend.listMyCourses();
     const course=cloudCourses.find(c=>c.id===className)||cloudCourses.find(c=>`${c.title}${c.code?` · ${c.code}`:""}`===className)||cloudCourses.find(c=>c.title===className);
     if(!course) throw new Error("No connected class matches this selection. Create a course in Supabase first, then reload this portal.");
     const saved=await window.LearnixBackend.createAssignment({courseId:course.id,title,description:instructions,dueAt:new Date(`${due}T23:59:00`).toISOString(),maxMarks:100});
     assignments.unshift({id:saved.id,title:saved.title,className:course.title,due, instructions:saved.description,status:"published",cloud:true});
     saveStore(storeKey,assignments); closeModal(); renderAssignmentRows(); updatePending(); showToast("Assignment published to the shared Learnix workspace. Students in this class can now see it.");
   }catch(error){showToast(error.message||"Could not publish assignment.");}
   return;
 }
 const item=window.Learnix ? new Learnix.Assignment({id:Date.now(),title,className,due,instructions}) : {id:Date.now(),title,className,due,instructions};
 if(window.Learnix ? !item.validate() : (!item.title||!item.due))return;
 if(window.Learnix){Learnix.AssignmentRepository.add(item,storeKey);assignments=Learnix.AssignmentRepository.all(storeKey)}else{assignments.push(item);saveStore(storeKey,assignments)}
 closeModal();showToast("Assignment created in demo mode. Configure Supabase to share it across portals.");updatePending();if($(".nav-item.active")?.dataset.view==="assignments")renderAssignmentRows();
});$$(".nav-item[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
$$("[data-open]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.open)));
$$("[data-class]").forEach(b=>b.addEventListener("click",()=>{setView("classes");showToast(`${b.dataset.class} selected · sample class details`)}));
$("#take-attendance").onclick=()=>setView("attendance");
$("#top-profile").onclick=()=>setView("settings");
$("#notifications").onclick=()=>showToast("You have 12 submissions to review and 3 upcoming deadlines (sample data).");
$("#dismiss-notice").onclick=()=>$(".welcome-strip").remove();
$("#logout").onclick=()=>{localStorage.removeItem("learnix_demo_session");location.href="index.html"};
$("#mobile-menu").onclick=()=>$("#sidebar").classList.toggle("open");
$("#global-search").addEventListener("keydown",e=>{if(e.key==="Enter"){const q=e.target.value.trim().toLowerCase();if(!q)return;const match=demoStudents.find(s=>(s.name+" "+s.course+" "+s.id).toLowerCase().includes(q));if(match){setView("students");setTimeout(()=>{const inp=$("#student-search");if(inp){inp.value=q;inp.dispatchEvent(new Event("input"))}},100)}else if(classNames.some(c=>c.toLowerCase().includes(q))){setView("classes")}else if(["assignment","deadline","submission","grade"].some(w=>q.includes(w))){setView(q.includes("grade")||q.includes("submission")?"grading":"assignments")}else{showToast("No matching sample records. Try a student, class, or assignment.");}}});
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#global-search").focus()}if(e.key==="Escape"&&!$("#modal-backdrop").hidden)closeModal()});
renderAssignmentRows();
syncTeacherWorkspace();
function greet(){const h=new Date().getHours();return h<12?"Good morning":h<17?"Good afternoon":"Good evening"}
$("#greeting").innerHTML=`${greet()}, ${escapeHtml(firstName)} <span>✦</span>`;
// Grading queue: score and return each submission
const gradedKey="learnix_teacher_graded";
const queue=[["Aarav Mehta","LX-2301"],["Ananya Singh","LX-2302"],["Rohan Verma","LX-2303"],["Ishita Sharma","LX-2304"],["Kabir Das","LX-2305"],["Meera Patel","LX-2306"]];
function updatePending(){const n=Math.max(0,12-Object.keys(readStore(gradedKey,{})).length);$("#pending-count").textContent=n;const em=$('.nav-item[data-view="grading"] em');if(em)em.textContent=n}
function openGrading(){
 const box=$("#workspace-content");let host=$("#grade-queue");
 if(!host){host=document.createElement("div");host.id="grade-queue";host.style.marginTop="18px";box.appendChild(host)}
 const done=readStore(gradedKey,{});const left=queue.filter(q=>!done[q[1]]);
 host.innerHTML=`<h3 style="margin:0 0 4px">Data Structures practice set</h3><p style="margin:0 0 8px;color:var(--muted)">${left.length?"Add a mark and one next step, then return each submission.":"Queue clear. Every submission in this set has feedback."}</p>`+left.map(q=>`<div class="grade-row" data-id="${q[1]}"><div><b>${q[0]}</b><br><small>${q[1]}</small></div><input type="number" min="0" max="100" placeholder="Mark /100" aria-label="Mark for ${q[0]}"><input placeholder="One practical next step" aria-label="Feedback for ${q[0]}" maxlength="160"><button class="primary-button" data-return>Return</button></div>`).join("");
 $$("[data-return]",host).forEach(b=>b.onclick=()=>{const row=b.closest(".grade-row"),[m,f]=$$("input",row),v=Number(m.value);if(m.value===""||v<0||v>100){showToast("Enter a mark between 0 and 100.");m.focus();return}const d=readStore(gradedKey,{});d[row.dataset.id]={mark:v,feedback:f.value.trim()};saveStore(gradedKey,d);updatePending();showToast("Feedback returned.");openGrading()});
}
updatePending();
// Saved assignments show in Priority work after a reload
assignments.slice(-3).forEach(a=>{const r=document.createElement("div");r.className="priority-row";r.innerHTML=`<div class="priority-symbol blue-bg">☑</div><div class="priority-copy"><b></b><span></span></div><span class="priority-tag upcoming">Created</span>`;r.querySelector("b").textContent=a.title;r.querySelector("span").textContent=`${a.className} · Due ${formatDate(a.due)}`;$("#priority-list").prepend(r)});
// Mobile menu: tap outside to close
$("#scrim").onclick=()=>$("#sidebar").classList.remove("open");
