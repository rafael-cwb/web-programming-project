<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/conexao.php';

// Lida com pré-requisição (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    if (!isset($_SESSION['id_usuario'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Usuário não autenticado']);
        exit;
    }

    $db = new Conexao();
    $conn = $db->getConexao();
    $id_usuario = $_SESSION['id_usuario'];

    switch ($_SERVER['REQUEST_METHOD']) {

        // BUSCAR TAGS DE UM LINK (GET)
        case 'GET':
            $id_link = $_GET['id_link'] ?? null;
            
            if (!$id_link) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID do link é obrigatório']);
                exit;
            }

            // Verificar se o link pertence ao usuário
            $stmt = $conn->prepare("SELECT id_link FROM Link WHERE id_link = ? AND id_usuario = ?");
            $stmt->bind_param("ii", $id_link, $id_usuario);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Link não encontrado']);
                exit;
            }

            // Buscar tags do link
            $stmt = $conn->prepare("
                SELECT t.id_tag, t.nome 
                FROM Tag t
                INNER JOIN Link_Tag lt ON t.id_tag = lt.id_tag
                WHERE lt.id_link = ? AND t.id_usuario = ?
            ");
            $stmt->bind_param("ii", $id_link, $id_usuario);
            $stmt->execute();
            $result = $stmt->get_result();

            $tags = [];
            while ($row = $result->fetch_assoc()) {
                $tags[] = $row;
            }

            echo json_encode(['success' => true, 'tags' => $tags]);
            break;

        // ADICIONAR TAG A UM LINK (POST)
        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (empty($data['id_link']) || empty($data['id_tag'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID do link e ID da tag são obrigatórios']);
                exit;
            }

            $id_link = intval($data['id_link']);
            $id_tag = intval($data['id_tag']);

            // Verificar se o link pertence ao usuário
            $stmt = $conn->prepare("SELECT id_link FROM Link WHERE id_link = ? AND id_usuario = ?");
            $stmt->bind_param("ii", $id_link, $id_usuario);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Link não encontrado']);
                exit;
            }

            // Verificar se a tag pertence ao usuário
            $stmt = $conn->prepare("SELECT id_tag FROM Tag WHERE id_tag = ? AND id_usuario = ?");
            $stmt->bind_param("ii", $id_tag, $id_usuario);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Tag não encontrada']);
                exit;
            }

            // Verificar se a associação já existe
            $stmt = $conn->prepare("SELECT * FROM Link_Tag WHERE id_link = ? AND id_tag = ?");
            $stmt->bind_param("ii", $id_link, $id_tag);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Tag já está associada ao link']);
                exit;
            }

            // Criar a associação
            $stmt = $conn->prepare("INSERT INTO Link_Tag (id_link, id_tag) VALUES (?, ?)");
            $stmt->bind_param("ii", $id_link, $id_tag);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true, 
                    'message' => 'Tag adicionada ao link com sucesso'
                ]);
            } else {
                throw new Exception("Erro ao adicionar tag ao link: " . $stmt->error);
            }
            break;

        // ATUALIZAR TAGS DE UM LINK (PUT)
        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (empty($data['id_link'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID do link é obrigatório']);
                exit;
            }

            $id_link = intval($data['id_link']);
            $tag_ids = $data['tag_ids'] ?? [];

            // Verificar se o link pertence ao usuário
            $stmt = $conn->prepare("SELECT id_link FROM Link WHERE id_link = ? AND id_usuario = ?");
            $stmt->bind_param("ii", $id_link, $id_usuario);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Link não encontrado']);
                exit;
            }

            // Iniciar transação
            $conn->autocommit(false);

            try {
                // Remover todas as tags antigas do link
                $stmt = $conn->prepare("DELETE FROM Link_Tag WHERE id_link = ?");
                $stmt->bind_param("i", $id_link);
                $stmt->execute();

                // Adicionar as novas tags
                if (!empty($tag_ids)) {
                    // Verificar se todas as tags pertencem ao usuário
                    $placeholders = str_repeat('?,', count($tag_ids) - 1) . '?';
                    $stmt = $conn->prepare("SELECT id_tag FROM Tag WHERE id_tag IN ($placeholders) AND id_usuario = ?");
                    $params = array_merge($tag_ids, [$id_usuario]);
                    $types = str_repeat('i', count($params));
                    $stmt->bind_param($types, ...$params);
                    $stmt->execute();
                    $result = $stmt->get_result();

                    if ($result->num_rows !== count($tag_ids)) {
                        throw new Exception("Uma ou mais tags não pertencem ao usuário");
                    }

                    // Inserir as novas associações
                    $stmt = $conn->prepare("INSERT INTO Link_Tag (id_link, id_tag) VALUES (?, ?)");
                    foreach ($tag_ids as $tag_id) {
                        $stmt->bind_param("ii", $id_link, $tag_id);
                        $stmt->execute();
                    }
                }

                $conn->commit();
                echo json_encode([
                    'success' => true, 
                    'message' => 'Tags do link atualizadas com sucesso'
                ]);

            } catch (Exception $e) {
                $conn->rollback();
                throw $e;
            }
            break;

        // REMOVER TAG DE UM LINK (DELETE)
        case 'DELETE':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (empty($data['id_link'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID do link é obrigatório']);
                exit;
            }

            $id_link = intval($data['id_link']);
            $id_tag = isset($data['id_tag']) ? intval($data['id_tag']) : null;

            // Verificar se o link pertence ao usuário
            $stmt = $conn->prepare("SELECT id_link FROM Link WHERE id_link = ? AND id_usuario = ?");
            $stmt->bind_param("ii", $id_link, $id_usuario);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Link não encontrado']);
                exit;
            }

            if ($id_tag) {
                // Remover uma tag específica do link
                $stmt = $conn->prepare("
                    DELETE lt FROM Link_Tag lt
                    INNER JOIN Tag t ON lt.id_tag = t.id_tag
                    WHERE lt.id_link = ? AND lt.id_tag = ? AND t.id_usuario = ?
                ");
                $stmt->bind_param("iii", $id_link, $id_tag, $id_usuario);
                $stmt->execute();

                if ($stmt->affected_rows > 0) {
                    echo json_encode(['success' => true, 'message' => 'Tag removida do link com sucesso']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Tag não encontrada ou não pertence ao usuário']);
                }
            } else {
                // Remover todas as tags do link
                $stmt = $conn->prepare("
                    DELETE lt FROM Link_Tag lt
                    INNER JOIN Tag t ON lt.id_tag = t.id_tag
                    WHERE lt.id_link = ? AND t.id_usuario = ?
                ");
                $stmt->bind_param("ii", $id_link, $id_usuario);
                $stmt->execute();

                echo json_encode(['success' => true, 'message' => 'Todas as tags foram removidas do link']);
            }
            break;

        // MÉTODO DESCONHECIDO
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método não permitido']);
            break;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro no servidor: ' . $e->getMessage()]);
}
?>