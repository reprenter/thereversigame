#include <iostream>
#include <httplib.h>
#include <json.h>
#include <vector>
#include <random>
#include <algorithm>

using json = nlohmann::json;

#define BOARD_SIZE 8
#define EMPTY 0
#define BLACK 1
#define WHITE 2

// Структура для хода
struct Move {
    int x;
    int y;
    int score;
};

// Глобальные переменные
std::vector<std::vector<int>> board(BOARD_SIZE, std::vector<int>(BOARD_SIZE, EMPTY));
std::random_device rd;
std::mt19937 gen(rd());

// Прототипы функций
bool isValidMove(const std::vector<std::vector<int>>& board, int x, int y, int player);
std::vector<Move> getValidMoves(const std::vector<std::vector<int>>& board, int player);
void makeMove(std::vector<std::vector<int>>& board, int x, int y, int player);
int evaluateBoard(const std::vector<std::vector<int>>& board, int player);
Move getBestMove(std::vector<std::vector<int>> board, int depth, int player);
int alphaBeta(std::vector<std::vector<int>>& board, int depth, int alpha, int beta, bool maximizingPlayer, int player);
Move getRandomMove(const std::vector<std::vector<int>>& board, int player);

// Направления для проверки ходов
const int dx[] = {-1, -1, -1, 0, 0, 1, 1, 1};
const int dy[] = {-1, 0, 1, -1, 1, -1, 0, 1};

bool isValidMove(const std::vector<std::vector<int>>& board, int x, int y, int player) {
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || board[x][y] != EMPTY) {
        return false;
    }

    int opponent = (player == BLACK) ? WHITE : BLACK;

    for (int dir = 0; dir < 8; dir++) {
        int nx = x + dx[dir];
        int ny = y + dy[dir];
        bool foundOpponent = false;

        while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
            if (board[nx][ny] == opponent) {
                foundOpponent = true;
            } else if (board[nx][ny] == player && foundOpponent) {
                return true;
            } else {
                break;
            }
            nx += dx[dir];
            ny += dy[dir];
        }
    }
    return false;
}

std::vector<Move> getValidMoves(const std::vector<std::vector<int>>& board, int player) {
    std::vector<Move> moves;
    for (int i = 0; i < BOARD_SIZE; i++) {
        for (int j = 0; j < BOARD_SIZE; j++) {
            if (isValidMove(board, i, j, player)) {
                moves.push_back({i, j, 0});
            }
        }
    }
    return moves;
}

void makeMove(std::vector<std::vector<int>>& board, int x, int y, int player) {
    board[x][y] = player;
    int opponent = (player == BLACK) ? WHITE : BLACK;

    for (int dir = 0; dir < 8; dir++) {
        int nx = x + dx[dir];
        int ny = y + dy[dir];
        std::vector<std::pair<int, int>> toFlip;

        while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
            if (board[nx][ny] == opponent) {
                toFlip.push_back({nx, ny});
            } else if (board[nx][ny] == player) {
                for (const auto& pos : toFlip) {
                    board[pos.first][pos.second] = player;
                }
                break;
            } else {
                break;
            }
            nx += dx[dir];
            ny += dy[dir];
        }
    }
}

int evaluateBoard(const std::vector<std::vector<int>>& board, int player) {
    int score = 0;
    // Веса для разных позиций на доске
    const int weights[8][8] = {
        {100, -20, 10, 5, 5, 10, -20, 100},
        {-20, -50, -2, -2, -2, -2, -50, -20},
        {10, -2, -1, -1, -1, -1, -2, 10},
        {5, -2, -1, -1, -1, -1, -2, 5},
        {5, -2, -1, -1, -1, -1, -2, 5},
        {10, -2, -1, -1, -1, -1, -2, 10},
        {-20, -50, -2, -2, -2, -2, -50, -20},
        {100, -20, 10, 5, 5, 10, -20, 100}
    };

    for (int i = 0; i < BOARD_SIZE; i++) {
        for (int j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] == player) {
                score += weights[i][j];
            } else if (board[i][j] == (player == BLACK ? WHITE : BLACK)) {
                score -= weights[i][j];
            }
        }
    }
    return score;
}

int alphaBeta(std::vector<std::vector<int>>& board, int depth, int alpha, int beta, bool maximizingPlayer, int player) {
    // Сначала проверяем терминальное состояние
    std::vector<Move> currentPlayerMoves = getValidMoves(board, player);
    std::vector<Move> opponentMoves = getValidMoves(board, player == BLACK ? WHITE : BLACK);
    
    // Если игра закончена (никто не может ходить), возвращаем финальную оценку
    if (currentPlayerMoves.empty() && opponentMoves.empty()) {
        return evaluateBoard(board, player) * 1000; // Умножаем на 1000, так как это терминальное состояние
    }

    // Если достигли максимальной глубины
    if (depth == 0) {
        return evaluateBoard(board, player);
    }

    // Получаем ходы для текущего игрока
    std::vector<Move> moves = getValidMoves(board, maximizingPlayer ? player : (player == BLACK ? WHITE : BLACK));
    
    // Если текущий игрок не может ходить, но противник может - пропускаем ход
    if (moves.empty()) {
        return alphaBeta(board, depth - 1, alpha, beta, !maximizingPlayer, player);
    }

    if (maximizingPlayer) {
        int maxEval = INT_MIN;
        for (const auto& move : moves) {
            auto tempBoard = board;
            makeMove(tempBoard, move.x, move.y, player);
            int eval = alphaBeta(tempBoard, depth - 1, alpha, beta, false, player);
            maxEval = std::max(maxEval, eval);
            alpha = std::max(alpha, eval);
            if (beta <= alpha) {
                break;
            }
        }
        return maxEval;
    } else {
        int minEval = INT_MAX;
        for (const auto& move : moves) {
            auto tempBoard = board;
            makeMove(tempBoard, move.x, move.y, player == BLACK ? WHITE : BLACK);
            int eval = alphaBeta(tempBoard, depth - 1, alpha, beta, true, player);
            minEval = std::min(minEval, eval);
            beta = std::min(beta, eval);
            if (beta <= alpha) {
                break;
            }
        }
        return minEval;
    }
}

Move getBestMove(std::vector<std::vector<int>> board, int depth, int player) {
    std::vector<Move> moves = getValidMoves(board, player);
    if (moves.empty()) {
        return {-1, -1, 0};
    }

    Move bestMove = moves[0];
    int maxEval = INT_MIN;
    int alpha = INT_MIN;
    int beta = INT_MAX;

    for (auto& move : moves) {
        auto tempBoard = board;
        makeMove(tempBoard, move.x, move.y, player);
        int eval = alphaBeta(tempBoard, depth - 1, alpha, beta, false, player);
        if (eval > maxEval) {
            maxEval = eval;
            bestMove = move;
        }
        alpha = std::max(alpha, eval);
    }

    return bestMove;
}

Move getRandomMove(const std::vector<std::vector<int>>& board, int player) {
    std::vector<Move> moves = getValidMoves(board, player);
    if (moves.empty()) {
        return {-1, -1, 0};
    }
    std::uniform_int_distribution<> dis(0, moves.size() - 1);
    return moves[dis(gen)];
}

int main() {
    httplib::Server app;

    // CORS middleware
    app.set_pre_routing_handler([](const auto& req, auto& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        
        if (req.method == "OPTIONS") {
            res.status = 204;
            return httplib::Server::HandlerResponse::Handled;
        }
        return httplib::Server::HandlerResponse::Unhandled;
    });

    // Инициализация новой игры
    app.Post("/new-game", [](const auto& req, auto& res) {
        board = std::vector<std::vector<int>>(BOARD_SIZE, std::vector<int>(BOARD_SIZE, EMPTY));
        // Начальная позиция
        board[3][3] = WHITE;
        board[3][4] = BLACK;
        board[4][3] = BLACK;
        board[4][4] = WHITE;

        json response = {
            {"status", "ok"},
            {"board", board}
        };
        res.set_content(response.dump(), "application/json");
    });

    // Получение хода бота
    app.Post("/bot-move", [](const auto& req, auto& res) {
        try {
            json request = json::parse(req.body);
            int difficulty = request["difficulty"].get<int>();
            int player = request["player"].get<int>();
            board = request["board"].get<std::vector<std::vector<int>>>();

            Move botMove;
            switch (difficulty) {
                case 1: // Легкий (случайный ход)
                    botMove = getRandomMove(board, player);
                    break;
                case 2: // Средний (глубина 3)
                    std::cout << "Making move with depth 3..." << std::endl;
                    botMove = getBestMove(board, 3, player);
                    break;
                case 3: // Сложный (глубина 7)
                    std::cout << "Making move with depth 7..." << std::endl;
                    botMove = getBestMove(board, 7, player);
                    break;
                default:
                    botMove = getRandomMove(board, player);
            }

            if (botMove.x != -1) {
                makeMove(board, botMove.x, botMove.y, player);
            }

            json response = {
                {"status", "ok"},
                {"move", {{"x", botMove.x}, {"y", botMove.y}}},
                {"board", board}
            };
            res.set_content(response.dump(), "application/json");
        } catch (const std::exception& e) {
            json response = {
                {"status", "error"},
                {"message", e.what()}
            };
            res.set_content(response.dump(), "application/json");
        }
    });

    // Проверка возможных ходов
    app.Post("/valid-moves", [](const auto& req, auto& res) {
        try {
            json request = json::parse(req.body);
            int player = request["player"].get<int>();
            board = request["board"].get<std::vector<std::vector<int>>>();

            auto moves = getValidMoves(board, player);
            std::vector<std::pair<int, int>> validMoves;
            for (const auto& move : moves) {
                validMoves.push_back({move.x, move.y});
            }

            json response = {
                {"status", "ok"},
                {"moves", validMoves}
            };
            res.set_content(response.dump(), "application/json");
        } catch (const std::exception& e) {
            json response = {
                {"status", "error"},
                {"message", e.what()}
            };
            res.set_content(response.dump(), "application/json");
        }
    });

    // Выполнение хода игрока
    app.Post("/make-move", [](const auto& req, auto& res) {
        try {
            json request = json::parse(req.body);
            int x = request["x"].get<int>();
            int y = request["y"].get<int>();
            int player = request["player"].get<int>();
            board = request["board"].get<std::vector<std::vector<int>>>();

            if (isValidMove(board, x, y, player)) {
                makeMove(board, x, y, player);
                json response = {
                    {"status", "ok"},
                    {"board", board}
                };
                res.set_content(response.dump(), "application/json");
            } else {
                json response = {
                    {"status", "error"},
                    {"message", "Invalid move"}
                };
                res.set_content(response.dump(), "application/json");
            }
        } catch (const std::exception& e) {
            json response = {
                {"status", "error"},
                {"message", e.what()}
            };
            res.set_content(response.dump(), "application/json");
        }
    });

    std::cout << "Server started on http://localhost:8080" << std::endl;
    app.listen("0.0.0.0", 8080);
    return 0;
}
