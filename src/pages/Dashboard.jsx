import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/axios'

const STATUS_LABEL = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluída',
}

const PRIORITY_LABEL = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
}

const PRIORITY_COLOR = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}

const STATUS_COLOR = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', status: 'pending', due_date: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    try {
      const response = await api.get('/tasks')
      setTasks(response.data)
    } catch {
      setError('Erro ao carregar tarefas.')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingTask(null)
    setForm({ title: '', description: '', priority: 'medium', status: 'pending', due_date: '' })
    setShowModal(true)
  }

  function openEdit(task) {
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      due_date: task.due_date ? task.due_date.substring(0, 10) : '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    try {
      if (editingTask) {
        const response = await api.put(`/tasks/${editingTask.id}`, form)
        setTasks(tasks.map(t => t.id === editingTask.id ? response.data : t))
      } else {
        const response = await api.post('/tasks', form)
        setTasks([response.data, ...tasks])
      }
      setShowModal(false)
    } catch {
      setError('Erro ao salvar tarefa.')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Deseja deletar esta tarefa?')) return
    try {
      await api.delete(`/tasks/${id}`)
      setTasks(tasks.filter(t => t.id !== id))
    } catch {
      setError('Erro ao deletar tarefa.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Task Manager</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Olá, <b>{user?.name}</b></span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Sair</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Minhas Tarefas</h2>
          <button
            onClick={openCreate}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Nova Tarefa
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
        )}

        {loading ? (
          <p className="text-gray-400 text-sm">Carregando tarefas...</p>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">Nenhuma tarefa ainda</p>
            <p className="text-sm mt-1">Clique em "Nova Tarefa" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-gray-900">{task.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[task.priority]}`}>
                      {PRIORITY_LABEL[task.priority]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[task.status]}`}>
                      {STATUS_LABEL[task.status]}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-500 truncate">{task.description}</p>
                  )}
                  {task.due_date && (
                    <p className="text-xs text-gray-400 mt-1">Vence em: {new Date(task.due_date).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(task)} className="text-sm text-violet-600 hover:underline">Editar</button>
                  <button onClick={() => handleDelete(task.id)} className="text-sm text-red-500 hover:underline">Deletar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Título da tarefa"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <textarea
                placeholder="Descrição (opcional)"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                rows={3}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Prioridade</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em andamento</option>
                    <option value="completed">Concluída</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data de vencimento</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm({ ...form, due_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg py-2.5 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg py-2.5 transition"
              >
                {editingTask ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}