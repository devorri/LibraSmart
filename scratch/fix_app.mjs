import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<span className={\\badge } style={{ fontSize: \'0.68rem\', padding: \'2px 8px\' }}>',
  '<span className={`badge ${user.role === "Administrator" ? "badge-warning" : user.role === "Librarian" ? "badge-info" : user.role === "Teacher" ? "badge-success" : "badge-secondary"}`} style={{ fontSize: \'0.68rem\', padding: \'2px 8px\' }}>'
);

code = code.replace(
  '<div className={login-alert }>{editUserMsg.text}</div>',
  '<div className={`login-alert ${editUserMsg.type}`}>{editUserMsg.text}</div>'
);

code = code.replace(
  '<input type="text" value={@} disabled style={{ opacity: 0.6 }} />',
  '<input type="text" value={`@${editingUser.username}`} disabled style={{ opacity: 0.6 }} />'
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('App.tsx repaired!');
